import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Chip
} from '@mui/material';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import AutoModeOutlinedIcon from '@mui/icons-material/AutoModeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PepIAChat from '../components/PepIAChat';
import PepIATarefas from '../components/PepIATarefas';
import PepIAAprendizado from '../components/PepIAAprendizado';
import PepIAMonitoramento from '../components/PepIAMonitoramento';
import PepIAAnaliseObras from '../components/PepIAAnaliseObras';
import PepIAAutomacaoPDF from '../components/PepIAAutomacaoPDF';

export default function PepIASection() {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = [
    { label: 'Chat', icon: <ChatOutlinedIcon />, badge: null },
    { label: 'Automatizar Tarefas', icon: <AutoModeOutlinedIcon />, badge: null },
    { label: 'Automação PDF', icon: <PictureAsPdfIcon />, badge: 'Novo' },
    { label: 'Aprendizado', icon: <SchoolOutlinedIcon />, badge: null },
    { label: 'Análise Obras', icon: <AnalyticsOutlinedIcon />, badge: null },
    { label: 'Monitoramento', icon: <MonitorHeartOutlinedIcon />, badge: null },
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Container maxWidth="xl">
        {/* HEADER PREMIUM */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                letterSpacing: '-0.02em',
                textShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              🤖 pepIA
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: { xs: '0.9rem', md: '1.1rem' }
              }}
            >
              Inteligência Artificial para Gestão Inteligente
            </Typography>
          </Box>
        </Fade>

        {/* TABS CONTAINER PREMIUM */}
        <Paper 
          elevation={24}
          sx={{ 
            borderRadius: { xs: 3, md: 4 },
            overflow: 'hidden',
            background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}
        >
          {/* TABS NAVIGATION */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: '3px solid rgba(255,255,255,0.1)'
          }}>
            <Tabs 
              value={tab} 
              onChange={(_, v) => setTab(v)} 
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
              sx={{
                minHeight: { xs: 56, md: 72 },
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '4px 4px 0 0',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  boxShadow: '0 -2px 10px rgba(255,215,0,0.5)'
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                  minHeight: { xs: 56, md: 72 },
                  color: 'rgba(255,255,255,0.7)',
                  px: { xs: 1, sm: 1.5, md: 2 },
                  py: { xs: 1, md: 1.5 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: 'rgba(255,255,255,0.95)',
                    background: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-selected': {
                    color: '#fff',
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }
                }
              }}
            >
              {tabs.map((t, idx) => (
                <Tab 
                  key={idx}
                  icon={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {t.icon}
                      {t.badge && (
                        <Chip 
                          label={t.badge} 
                          size="small" 
                          sx={{ 
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: '#FFD700',
                            color: '#333',
                            fontWeight: 700,
                            ml: 0.5
                          }} 
                        />
                      )}
                    </Box>
                  }
                  label={!isMobile ? t.label : null}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>

          {/* CONTENT AREA */}
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: { xs: '60vh', md: '70vh' },
            bgcolor: '#fafafa'
          }}>
            <Fade in key={tab} timeout={500}>
              <Box>
                {tab === 0 && <PepIAChat />}
                {tab === 1 && <PepIATarefas />}
                {tab === 2 && <PepIAAutomacaoPDF />}
                {tab === 3 && <PepIAAprendizado />}
                {tab === 4 && <PepIAAnaliseObras />}
                {tab === 5 && <PepIAMonitoramento />}
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
