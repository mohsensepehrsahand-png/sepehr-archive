"use client";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, InputAdornment, IconButton, Card, CardContent, Avatar, Chip, LinearProgress, alpha, Paper, useTheme } from "@mui/material";
import { Search, Clear, Folder, CreateNewFolder, Image, PictureAsPdf, Description, TableChart } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  description?: string;
  projectName?: string | null;
  folderName?: string | null;
  icon: React.ReactNode;
  color: string;
}

interface SmartSearchWidgetProps {
  projects: any[];
  recentDocuments: any[];
}

export default function SmartSearchWidget({ projects, recentDocuments }: SmartSearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image />;
    if (mimeType === 'application/pdf') return <PictureAsPdf />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <TableChart />;
    return <Description />;
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const projectsResults = projects.filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase())
      ).map(project => ({
        type: 'project',
        id: project.id,
        title: project.name,
        description: project.description,
        projectName: null,
        folderName: null,
        icon: <Folder />,
        color: 'primary'
      }));

      const foldersResults = [];
      for (const project of projects) {
        try {
          const response = await fetch(`/api/folders?projectId=${project.id}`);
          if (response.ok) {
            const folders = await response.json();
            const matchingFolders = folders.filter(folder =>
              folder.name.toLowerCase().includes(query.toLowerCase()) ||
              folder.description?.toLowerCase().includes(query.toLowerCase())
            ).map(folder => ({
              type: 'folder',
              id: folder.id,
              title: folder.name,
              description: folder.description,
              projectName: project.name,
              folderName: null,
              icon: <CreateNewFolder />,
              color: 'secondary'
            }));
            foldersResults.push(...matchingFolders);
          }
        } catch (error) {
          console.error('Error fetching folders:', error);
        }
      }

      const documentsResults = recentDocuments.filter(document =>
        document.name.toLowerCase().includes(query.toLowerCase()) ||
        document.description?.toLowerCase().includes(query.toLowerCase())
      ).map(document => ({
        type: 'document',
        id: document.id,
        title: document.name,
        description: document.description,
        projectName: document.projectName || 'نامشخص',
        folderName: document.folderName || 'پوشه اصلی',
        icon: getDocumentIcon(document.mimeType),
        color: 'info'
      }));

      setSearchResults([...projectsResults, ...foldersResults, ...documentsResults]);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, projects, recentDocuments]);

  const handleResultClick = async (result: SearchResult) => {
    if (result.type === 'project') {
      router.push(`/projects/${result.id}`);
    } else if (result.type === 'folder') {
      const project = projects.find(p => p.name === result.projectName);
      if (project) {
        router.push(`/projects/${project.id}?folder=${result.id}`);
      }
    } else if (result.type === 'document') {
      try {
        const response = await fetch(`/api/documents/${result.id}`);
        if (response.ok) {
          const documentData = await response.json();
          if (documentData.filePath) {
            window.open(`/api/documents/${result.id}/download`, '_blank');
          }
        }
      } catch (error) {
        console.error('Error opening document:', error);
      }
    }
  };

  return (
    <Paper sx={{ 
      p: 3, 
      height: '100%',
      borderRadius: 3,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Search sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          جستجوی هوشمند
        </Typography>
      </Box>
      
      <TextField
        fullWidth
        placeholder="جستجو در پروژه‌ها، پوشه‌ها و اسناد..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: 'text.secondary' }}>
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }
        }}
      />

      {searchQuery && (
        <Box sx={{ mt: 2 }}>
          {isSearching ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
              <LinearProgress sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary">در حال جستجو...</Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {searchResults.length} نتیجه یافت شد
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {searchResults.slice(0, 5).map((result) => (
                  <Card 
                    key={`${result.type}-${result.id}`}
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${result.color}.main`, fontSize: '0.8rem' }}>
                          {result.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {result.title}
                          </Typography>
                          {result.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', display: 'block' }}>
                              {result.description}
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          label={result.type === 'project' ? 'پروژه' : result.type === 'folder' ? 'پوشه' : 'سند'}
                          size="small"
                          color={result.color as any}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              هیچ نتیجه‌ای یافت نشد
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}


