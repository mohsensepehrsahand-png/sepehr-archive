import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { logActivity } from "@/lib/activityLogger";

interface FileInfo {
  file: File;
  relativePath: string;
  folderPath: string;
  fileName: string;
  isTempFile?: boolean;
}

interface ProjectStructure {
  [projectName: string]: {
    [folderPath: string]: FileInfo[];
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== BULK UPLOAD REQUEST START ===');
    
    const formData = await request.formData();
    const createdBy = formData.get('createdBy') as string;
    
    if (!createdBy) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can upload
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز آپلود ندارید' },
        { status: 403 }
      );
    }

    // Extract all files from FormData
    const files: FileInfo[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        const file = value as File;
        const relativePath = file.webkitRelativePath || file.name;
        
        // Parse the path to extract project name and folder structure
        const pathParts = relativePath.split('/');
        const projectName = pathParts[0];
        const folderPath = pathParts.slice(1, -1).join('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // Check if this is a temp file for empty folder
        const isTempFile = fileName === '.temp_empty_folder' || fileName.startsWith('.temp_');
        
        files.push({
          file,
          relativePath,
          folderPath,
          fileName,
          isTempFile
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'هیچ فایلی برای آپلود یافت نشد' },
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} files`);
    
    // Debug: Log all file paths to understand the structure
    console.log('=== FILE PATHS DEBUG ===');
    files.forEach((fileInfo, index) => {
      console.log(`File ${index + 1}: ${fileInfo.relativePath}`);
    });
    console.log('=== END FILE PATHS DEBUG ===');

    // Group files by project and folder structure
    const projectStructure: ProjectStructure = {};
    const allDetectedPaths = new Set<string>(); // Track all detected paths from file structure
    
    // First pass: collect all possible folder paths from file structure
    files.forEach(fileInfo => {
      const pathParts = fileInfo.relativePath.split('/');
      const projectName = pathParts[0];
      
      // Add all possible folder paths for this file
      for (let i = 1; i < pathParts.length; i++) {
        const folderPath = pathParts.slice(1, i).join('/');
        if (folderPath) {
          allDetectedPaths.add(`${projectName}/${folderPath}`);
        }
      }
    });

    console.log('All detected paths from files:', Array.from(allDetectedPaths));

    // Second pass: build project structure with all detected folders
    files.forEach(fileInfo => {
      const pathParts = fileInfo.relativePath.split('/');
      const projectName = pathParts[0];
      const folderPath = pathParts.slice(1, -1).join('/') || 'root';
      
      if (!projectStructure[projectName]) {
        projectStructure[projectName] = {};
      }
      
      if (!projectStructure[projectName][folderPath]) {
        projectStructure[projectName][folderPath] = [];
      }
      
      projectStructure[projectName][folderPath].push(fileInfo);
    });

    // Third pass: add all detected empty folders to project structure
    allDetectedPaths.forEach(fullPath => {
      const [projectName, folderPath] = fullPath.split('/', 2);
      
      if (!projectStructure[projectName]) {
        projectStructure[projectName] = {};
      }
      
      // Add empty folder if it doesn't exist
      if (!projectStructure[projectName][folderPath]) {
        projectStructure[projectName][folderPath] = []; // Empty folder
        console.log(`Added empty folder: ${projectName}/${folderPath}`);
      }
    });

    console.log('Final project structure:', Object.keys(projectStructure));
    Object.entries(projectStructure).forEach(([projectName, folders]) => {
      console.log(`Project ${projectName} folders:`, Object.keys(folders));
    });

    const results = {
      projectsCreated: 0,
      foldersCreated: 0,
      documentsCreated: 0,
      errors: [] as string[],
      projectDetails: [] as any[],
      missingEmptyFolders: [] as string[]
    };

    // Process each project
    for (const [projectName, folders] of Object.entries(projectStructure)) {
      try {
        console.log(`Creating project: ${projectName}`);
        
        // Check if project with same name already exists
        const existingProject = await prisma.project.findFirst({
          where: {
            name: projectName,
            status: 'ACTIVE'
          }
        });

        if (existingProject) {
          results.errors.push(`پروژه با نام "${projectName}" قبلاً وجود دارد. لطفاً نام متفاوتی انتخاب کنید.`);
          continue; // Skip this project
        }
        
        // Create project
        const project = await prisma.project.create({
          data: {
            name: projectName,
            description: `پروژه ایجاد شده از آپلود گروهی - ${new Date().toLocaleDateString('fa-IR')}`,
            status: 'ACTIVE',
            createdBy,
            colorPrimary: "#1976d2",
            colorFolderDefault: "#90caf9",
            colorDocImage: "#26a69a",
            colorDocPdf: "#ef5350",
            bgColor: "#ffffff"
          }
        });

        results.projectsCreated++;

        // Track project details
        const projectDetail = {
          projectId: project.id,
          projectName: project.name,
          foldersCreated: 0,
          documentsCreated: 0,
          folderPaths: Object.keys(folders)
        };

        // Log project creation
        if (userId) {
          await logActivity({
            userId,
            action: 'CREATE',
            resourceType: 'PROJECT',
            resourceId: project.id,
            resourceName: project.name,
            description: `پروژه "${project.name}" از آپلود گروهی ایجاد شد`,
            metadata: {
              source: 'bulk_upload',
              foldersCount: Object.keys(folders).length,
              filesCount: Object.values(folders).flat().length
            }
          });
        }

        // Create folder structure and upload files
        const folderMap = new Map<string, string>(); // path -> folderId
        
        // Collect all unique folder paths from the project structure
        const allFolderPaths = new Set<string>();
        Object.keys(folders).forEach(folderPath => {
          if (folderPath !== 'root') {
            // Add all parent paths for nested folders
            const pathParts = folderPath.split('/');
            for (let i = 1; i <= pathParts.length; i++) {
              const partialPath = pathParts.slice(0, i).join('/');
              if (partialPath) {
                allFolderPaths.add(partialPath);
              }
            }
          }
        });
        
        // Sort folders by depth (root first, then nested)
        const sortedFolderPaths = Array.from(allFolderPaths).sort((a, b) => {
          const depthA = a.split('/').length;
          const depthB = b.split('/').length;
          return depthA - depthB;
        });

        console.log(`Creating ${sortedFolderPaths.length} folders for project ${projectName}:`, sortedFolderPaths);
        console.log(`All folders in project structure:`, Object.keys(folders));

        // Create all folders first (including empty ones)
        for (const folderPath of sortedFolderPaths) {
          try {
            const folderName = folderPath.split('/').pop() || 'پوشه';
            const parentPath = folderPath.split('/').slice(0, -1).join('/');
            const parentId = parentPath ? folderMap.get(parentPath) : project.id;
            
            console.log(`Creating folder: ${folderName} (path: ${folderPath}, parent: ${parentPath})`);
            
            const folder = await prisma.folder.create({
              data: {
                name: folderName,
                description: `پوشه ایجاد شده از آپلود گروهی`,
                projectId: project.id,
                parentId: parentId === project.id ? null : parentId,
                path: `/${folderPath}`,
                depth: folderPath.split('/').length,
                tabKey: 'BUYER', // Default tab
                createdBy
              }
            });
            
            folderMap.set(folderPath, folder.id);
            results.foldersCreated++;
            projectDetail.foldersCreated++;

            console.log(`Folder created successfully: ${folder.id}`);

            // Log folder creation
            if (userId) {
              await logActivity({
                userId,
                action: 'CREATE',
                resourceType: 'FOLDER',
                resourceId: folder.id,
                resourceName: folder.name,
                description: `پوشه "${folder.name}" در پروژه "${project.name}" ایجاد شد`,
                metadata: {
                  projectId: project.id,
                  parentPath: folderPath,
                  source: 'bulk_upload'
                }
              });
            }
          } catch (folderError) {
            console.error(`Error creating folder ${folderPath}:`, folderError);
            results.errors.push(`خطا در ایجاد پوشه ${folderPath}: ${folderError instanceof Error ? folderError.message : 'خطای نامشخص'}`);
          }
        }

        // Now process files in each folder
        for (const [folderPath, files] of Object.entries(folders)) {
          try {
            let folderId: string;
            
            if (folderPath === 'root') {
              // Root level - use project ID as folder reference
              folderId = project.id;
              console.log(`Processing root level files: ${files.length} files`);
            } else {
              // Get the folder ID from our map
              folderId = folderMap.get(folderPath) || project.id;
              console.log(`Processing folder "${folderPath}": ${files.length} files, folderId: ${folderId}`);
            }

            // Upload files in this folder (skip temp files)
            for (const fileInfo of files) {
              try {
                // Skip temp files - they were only used to detect empty folders
                if (fileInfo.isTempFile) {
                  console.log(`Skipping temp file: ${fileInfo.fileName}`);
                  continue;
                }
                
                const file = fileInfo.file;
                
                // Validate file type
                const allowedTypes = [
                  'application/pdf',
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'image/gif',
                  'text/plain',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ];

                if (!allowedTypes.includes(file.type)) {
                  results.errors.push(`نوع فایل ${file.type} پشتیبانی نمی‌شود: ${fileInfo.fileName}`);
                  continue;
                }

                // Validate file size (50MB max)
                const maxSize = 50 * 1024 * 1024;
                if (file.size > maxSize) {
                  results.errors.push(`اندازه فایل بیش از حد مجاز: ${fileInfo.fileName}`);
                  continue;
                }

                // Create upload directory
                let uploadDir: string;
                if (folderId === project.id) {
                  uploadDir = join(process.cwd(), 'uploads', project.id, 'root');
                } else {
                  uploadDir = join(process.cwd(), 'uploads', project.id, folderId);
                }

                await mkdir(uploadDir, { recursive: true });

                // Save file
                const fileName = `${Date.now()}_${fileInfo.fileName}`;
                const filePath = join(uploadDir, fileName);
                
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                await writeFile(filePath, buffer);

                // Create document record
                const document = await prisma.document.create({
                  data: {
                    name: fileInfo.fileName,
                    description: `سند آپلود شده از آپلود گروهی`,
                    projectId: project.id,
                    folderId: folderId === project.id ? null : folderId,
                    mimeType: file.type,
                    fileExt: fileInfo.fileName.split('.').pop() || '',
                    sizeBytes: file.size,
                    filePath: folderId === project.id ? 
                      `uploads/${project.id}/root/${fileName}` : 
                      `uploads/${project.id}/${folderId}/${fileName}`,
                    createdBy,
                    isUserUploaded: true
                  }
                });

                results.documentsCreated++;
                projectDetail.documentsCreated++;

                // Log document creation
                if (userId) {
                  await logActivity({
                    userId,
                    action: 'CREATE',
                    resourceType: 'DOCUMENT',
                    resourceId: document.id,
                    resourceName: document.name,
                    description: `سند "${document.name}" در پروژه "${project.name}" آپلود شد`,
                    metadata: {
                      projectId: project.id,
                      folderId: document.folderId,
                      mimeType: document.mimeType,
                      sizeBytes: document.sizeBytes,
                      source: 'bulk_upload'
                    }
                  });
                }

              } catch (fileError) {
                console.error(`Error processing file ${fileInfo.fileName}:`, fileError);
                results.errors.push(`خطا در آپلود فایل ${fileInfo.fileName}: ${fileError instanceof Error ? fileError.message : 'خطای نامشخص'}`);
              }
            }

          } catch (folderError) {
            console.error(`Error creating folder ${folderPath}:`, folderError);
            results.errors.push(`خطا در ایجاد پوشه ${folderPath}: ${folderError instanceof Error ? folderError.message : 'خطای نامشخص'}`);
          }
        }

        // Add project details to results
        results.projectDetails.push(projectDetail);

        // Check for missing empty folders (folders that should exist but don't have files)
        const allExpectedPaths = new Set<string>();
        Object.keys(folders).forEach(folderPath => {
          if (folderPath !== 'root') {
            const pathParts = folderPath.split('/');
            for (let i = 1; i <= pathParts.length; i++) {
              const partialPath = pathParts.slice(0, i).join('/');
              if (partialPath) {
                allExpectedPaths.add(`${projectName}/${partialPath}`);
              }
            }
          }
        });

        // Find folders that are empty (no files) and might be missing
        Object.entries(folders).forEach(([folderPath, files]) => {
          if (files.length === 0 && folderPath !== 'root') {
            results.missingEmptyFolders.push(`${projectName}/${folderPath}`);
          }
        });

      } catch (projectError) {
        console.error(`Error creating project ${projectName}:`, projectError);
        results.errors.push(`خطا در ایجاد پروژه ${projectName}: ${projectError instanceof Error ? projectError.message : 'خطای نامشخص'}`);
      }
    }

    console.log('=== BULK UPLOAD SUMMARY ===');
    console.log(`Projects created: ${results.projectsCreated}`);
    console.log(`Folders created: ${results.foldersCreated}`);
    console.log(`Documents created: ${results.documentsCreated}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Missing empty folders: ${results.missingEmptyFolders.length}`);
    if (results.missingEmptyFolders.length > 0) {
      console.log('Missing empty folders:', results.missingEmptyFolders);
    }

    console.log('=== BULK UPLOAD REQUEST COMPLETED ===');
    console.log('Results:', results);

    return NextResponse.json({
      success: true,
      message: `آپلود با موفقیت انجام شد`,
      ...results
    });

  } catch (error) {
    console.error('=== BULK UPLOAD REQUEST ERROR ===');
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { error: `خطا در آپلود گروهی: ${error instanceof Error ? error.message : 'خطای نامشخص'}` },
      { status: 500 }
    );
  }
}
