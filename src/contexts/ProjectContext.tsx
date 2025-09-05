"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  documents: number;
  createdBy: string;
  createdAt: string;
  colorPrimary: string;
  colorFolderDefault: string;
  lastActivity?: string;
  progress?: number;
  priority?: 'high' | 'medium' | 'low';
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'colorPrimary' | 'colorFolderDefault' | 'documents' | 'createdBy'>) => Promise<Project>;
  deleteProject: (id: string, forceDelete?: boolean) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?includeArchived=false');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'colorPrimary' | 'colorFolderDefault' | 'documents' | 'createdBy'>) => {
    try {
      console.log('Creating project with data:', projectData);
      
      // ابتدا کاربر admin را پیدا می‌کنیم
      const userResponse = await fetch('/api/users');
      if (!userResponse.ok) {
        throw new Error('خطا در دریافت اطلاعات کاربران');
      }
      
      const users = await userResponse.json();
      const adminUser = users.find((user: any) => user.role === 'ADMIN');
      
      if (!adminUser) {
        throw new Error('کاربر admin یافت نشد');
      }
      
      // ایجاد پروژه در دیتابیس
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description || '',
          status: projectData.status === 'فعال' ? 'ACTIVE' : 'ARCHIVED',
          createdBy: adminUser.id
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`خطا در ایجاد پروژه: ${response.status} - ${errorData}`);
      }

      const savedProject = await response.json();
      console.log('Project created successfully:', savedProject);
      
      // اضافه کردن به state محلی
      setProjects(prev => [savedProject, ...prev]);
      
      return savedProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error; // خطا را به بالا منتقل می‌کنیم
    }
  };

  const deleteProject = async (id: string, forceDelete: boolean = false) => {
    try {
      const url = forceDelete ? `/api/projects/${id}?force=true` : `/api/projects/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        // Project has content, return the content info
        const contentInfo = await response.json();
        throw new Error(JSON.stringify(contentInfo));
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`خطا در حذف پروژه: ${response.status} - ${errorData}`);
      }

      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`خطا در ویرایش پروژه: ${response.status} - ${errorData}`);
      }

      const updatedProject = await response.json();
      
      // If project is being archived, remove it from active projects list
      if (updates.status === 'آرشیو' || updates.status === 'ARCHIVED') {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else if (updates.status === 'فعال' || updates.status === 'ACTIVE') {
        // If project is being restored (status changed to ACTIVE), add it to active projects list
        setProjects(prev => {
          const exists = prev.find(p => p.id === id);
          if (!exists) {
            return [...prev, updatedProject];
          }
          return prev.map(p => p.id === id ? updatedProject : p);
        });
      } else {
        // Update local state for other changes
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      }
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      loading, 
      addProject, 
      deleteProject, 
      updateProject, 
      refreshProjects: fetchProjects 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}