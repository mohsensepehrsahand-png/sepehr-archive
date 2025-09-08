'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useRouter } from 'next/navigation';
import styles from './upload.module.css';

interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const { user } = useAuth();
  const { refreshProjects } = useProjects();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!user) {
      alert('لطفاً ابتدا وارد شوید');
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);
    setUploadResult(null);

    try {
      const formData = new FormData();
      
      // Add all files to FormData
      Array.from(files).forEach((file, index) => {
        formData.append(`files`, file);
      });

      // Add user info
      formData.append('createdBy', user.id);

      const response = await fetch('/api/upload/bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در آپلود');
      }

      const result = await response.json();
      setUploadResult(result);
      
      // Refresh projects list to show newly created projects
      if (result.projectsCreated > 0) {
        await refreshProjects();
      }
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`خطا در آپلود: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const goToProject = (projectId: string, projectName: string) => {
    router.push(`/projects/${projectId}`);
  };


  return (
    <div className={styles.uploadContainer}>
      <div className={styles.uploadCard}>
        {/* Main Content */}
        <div className={styles.uploadMainContent}>
          {/* Header */}
          <div className={styles.uploadHeader}>
            <h1 className={styles.uploadTitle}>
              آپلود گروهی پوشه‌ها
            </h1>
            <p className={styles.uploadSubtitle}>
              پوشه‌های خود را انتخاب کنید تا به صورت خودکار پروژه‌های جدید ایجاد شوند
            </p>
          </div>

        {/* Main Upload Area */}
        <div
          className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className={styles.uploadIcon}>📁</div>
          
          <div className={styles.uploadText}>
            <h3 className={styles.uploadMainText}>
              پوشه‌های خود را اینجا بکشید
            </h3>
            <p className={styles.uploadSubText}>
              یا روی دکمه زیر کلیک کنید
            </p>
          </div>
          
          <button
            onClick={openFileDialog}
            disabled={isUploading}
            className={styles.uploadButton}
          >
            {isUploading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={styles.loadingSpinner}></div>
                <span>در حال آپلود...</span>
              </div>
            ) : (
              'انتخاب پوشه‌ها'
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

          {/* Upload Progress */}
          {isUploading && (
            <div className={styles.uploadProgress}>
              <h3 className={styles.uploadProgressTitle}>در حال آپلود...</h3>
              <div>
                {uploadProgress.map((item, index) => (
                  <div key={index} className={styles.uploadProgressItem}>
                    <div className={styles.uploadProgressInfo}>
                      <div className={styles.uploadProgressFileName}>{item.fileName}</div>
                      <div className={styles.uploadProgressPercentage}>{item.progress}%</div>
                    </div>
                    <div className={styles.uploadProgressBar}>
                      <div
                        className={`${styles.uploadProgressFill} ${
                          item.status === 'completed'
                            ? styles.completed
                            : item.status === 'error'
                            ? styles.error
                            : styles.uploading
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Result - Mobile */}
          {uploadResult && (
            <div className={styles.uploadResult}>
              <div className={styles.uploadResultHeader}>
                <div className={styles.uploadResultIcon}>✅</div>
                <h3 className={styles.uploadResultTitle}>آپلود با موفقیت انجام شد!</h3>
              </div>
              <div className={styles.uploadResultStats}>
                <div className={styles.uploadResultStat}>
                  <div className={`${styles.uploadResultStatNumber} ${styles.projects}`}>
                    {uploadResult.projectsCreated}
                  </div>
                  <div className={styles.uploadResultStatLabel}>پروژه ایجاد شد</div>
                </div>
                <div className={styles.uploadResultStat}>
                  <div className={`${styles.uploadResultStatNumber} ${styles.folders}`}>
                    {uploadResult.foldersCreated}
                  </div>
                  <div className={styles.uploadResultStatLabel}>پوشه ایجاد شد</div>
                </div>
                <div className={styles.uploadResultStat}>
                  <div className={`${styles.uploadResultStatNumber} ${styles.documents}`}>
                    {uploadResult.documentsCreated}
                  </div>
                  <div className={styles.uploadResultStatLabel}>سند آپلود شد</div>
                </div>
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className={styles.uploadErrors}>
                  <h4 className={styles.uploadErrorsTitle}>خطاها:</h4>
                  <ul className={styles.uploadErrorsList}>
                    {uploadResult.errors.map((error: string, index: number) => (
                      <li key={index} className={styles.uploadErrorsItem}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Go to Projects Buttons - Mobile */}
              {uploadResult.projectDetails && uploadResult.projectDetails.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#166534', 
                    marginBottom: '1rem' 
                  }}>
                    پروژه‌های ایجاد شده:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {uploadResult.projectDetails.map((project: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => goToProject(project.projectId, project.projectName)}
                        className={styles.goToProjectButton}
                      >
                        <span>📁</span>
                        <span>رفتن به صفحه پروژه {project.projectName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Desktop */}
        {(isUploading || uploadResult) && (
          <div className={styles.uploadSidebar}>
            <div className={styles.uploadSidebarContent}>
              {/* Upload Progress */}
              {isUploading && (
                <div className={styles.uploadSidebarProgress}>
                  <div className={styles.uploadSidebarProgressTitle}>در حال آپلود...</div>
                  {uploadProgress.map((item, index) => (
                    <div key={index} className={styles.uploadSidebarProgressItem}>
                      <div className={styles.uploadSidebarProgressFileName}>{item.fileName}</div>
                      <div className={styles.uploadSidebarProgressBar}>
                        <div
                          className={`${styles.uploadSidebarProgressFill} ${
                            item.status === 'completed'
                              ? styles.completed
                              : item.status === 'error'
                              ? styles.error
                              : styles.uploading
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <>
                  {/* Go to Projects Buttons - Top */}
                  {uploadResult.projectDetails && uploadResult.projectDetails.length > 0 && (
                    <div className={styles.uploadSidebarProjects}>
                      <div className={styles.uploadSidebarProjectsTitle}>پروژه‌های ایجاد شده</div>
                      {uploadResult.projectDetails.map((project: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => goToProject(project.projectId, project.projectName)}
                          className={styles.uploadSidebarProjectButton}
                        >
                          <span>📁</span>
                          <span>{project.projectName}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Upload Stats */}
                  <div className={styles.uploadSidebarTitle}>آمار آپلود</div>
                  
                  <div className={styles.uploadSidebarStats}>
                    <div className={styles.uploadSidebarStat}>
                      <span className={styles.uploadSidebarStatLabel}>پروژه‌ها</span>
                      <span className={`${styles.uploadSidebarStatValue} ${styles.projects}`}>
                        {uploadResult.projectsCreated}
                      </span>
                    </div>
                    <div className={styles.uploadSidebarStat}>
                      <span className={styles.uploadSidebarStatLabel}>پوشه‌ها</span>
                      <span className={`${styles.uploadSidebarStatValue} ${styles.folders}`}>
                        {uploadResult.foldersCreated}
                      </span>
                    </div>
                    <div className={styles.uploadSidebarStat}>
                      <span className={styles.uploadSidebarStatLabel}>اسناد</span>
                      <span className={`${styles.uploadSidebarStatValue} ${styles.documents}`}>
                        {uploadResult.documentsCreated}
                      </span>
                    </div>
                  </div>

                  {/* Errors */}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className={styles.uploadSidebarErrors}>
                      <div className={styles.uploadSidebarErrorsTitle}>خطاها</div>
                      <ul className={styles.uploadSidebarErrorsList}>
                        {uploadResult.errors.map((error: string, index: number) => (
                          <li key={index} className={styles.uploadSidebarErrorsItem}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
