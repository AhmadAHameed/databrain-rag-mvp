import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppTheme } from '../contexts/ThemeContext';
import { pageColorSchemes } from '../utils/pageThemes';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const StyledPageContainer = styled(Box)(() => ({
  position: 'relative',
  minHeight: '100%',
}));

export const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
  return (
    <StyledPageContainer className={className}>
      {children}
    </StyledPageContainer>
  );
};

interface AccentCardProps {
  children: React.ReactNode;
  elevation?: number;
}

export const AccentCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'pageId',
})<AccentCardProps & { pageId?: string }>(({ theme, pageId }) => {
  const { currentPageId } = useAppTheme();
  const actualPageId = pageId || currentPageId;
  const colorScheme = pageColorSchemes[actualPageId as keyof typeof pageColorSchemes];
  return {
    borderLeft: `4px solid ${colorScheme?.accent || theme.palette.primary.main}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: `0 4px 20px ${colorScheme?.accent || theme.palette.primary.main}33`,
      transform: 'translateY(-2px)',
    },
  };
});

export const AccentButton = styled('button')(({ theme }) => {
  const { currentPageId } = useAppTheme();
  const colorScheme = pageColorSchemes[currentPageId];
  
  return {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${colorScheme.accent} 90%)`,
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    color: 'white',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: `0 4px 15px ${colorScheme.accent}44`,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };
});
