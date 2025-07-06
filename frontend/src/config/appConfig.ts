// Application Configuration
// This file contains all the hardcoded data and configuration for the application

import { ENV_CONFIG } from './environment';

export const APP_CONFIG = {
  // Project Information
  projectName: ENV_CONFIG.appName,
  projectIcon: '📊',
  version: ENV_CONFIG.appVersion,

  // Developer Information
  developer: {
    name: 'Ahmad Abdulhameed',
    company: 'MVP_COMPANY',
    email: 'a.a.elhameed@gmail.com',
    website: 'https://databrain.com'
  },

  // Application Description
  description: 'Your intelligent data management platform with AI-powered insights and advanced analytics',
  tagline: 'Intelligent Data Management Platform',

  // Hero Section
  hero: {
    title: 'Welcome to DataBrain',
    subtitle: 'Your intelligent data management platform with AI-powered insights and advanced analytics',
    ctaText: 'Get Started'
  },

  // Features
  features: [
    {
      title: 'AI Assistant',
      description: 'Get intelligent answers and insights from our AI-powered assistant.',
      path: '/ask',
    },
    {
      title: 'Smart Search',
      description: 'Search through your data with advanced filtering and analytics.',
      path: '/search',
    },
    {
      title: 'Admin Dashboard',
      description: 'Manage your data, users, and system settings.',
      path: '/admin',
    }
  ],

  // Statistics
  stats: {
    dataPoints: {
      label: 'Data Points',
      value: '1.2M+'
    },
    responseTime: {
      label: 'Response Time',
      value: '<100ms'
    },
    accuracy: {
      label: 'Accuracy',
      value: '99.9%'
    }
  },
  // Admin Dashboard Data
  adminDashboard: {
    stats: {
      totalDocuments: 1247,
      totalUsers: 89,
      totalStorage: '45.6 GB',
      monthlyUploads: 127
    },
    divisions: ['Engineering', 'Finance', 'Human Resources', 'Marketing', 'Operations'],
    departments: ['IT', 'Finance', 'HR', 'Marketing', 'Engineering', 'Operations', 'Legal', 'Sales'],
    documentNatures: ['Technical Report', 'Financial Report', 'Policy Document', 'Meeting Minutes', 'Project Plan'],
    fileTypes: ['PDF', 'Word Document', 'Excel Spreadsheet', 'PowerPoint', 'Text File', 'Image', 'Video'],
    authors: ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'Ahmad Abdulhameed'],
    priorityLevels: ['Low', 'Medium', 'High', 'Critical'],
    languages: ['English', 'Arabic', 'French', 'Spanish'],
    confidentialityLevels: ['Public', 'Internal', 'Confidential', 'Restricted']
  },

  // Navigation Menu
  navigation: [
    { text: 'Home', path: '/', iconName: 'Home' },
    { text: 'AI Assistant', path: '/ask', iconName: 'Psychology' },
    { text: 'Search', path: '/search', iconName: 'Search' },
    { text: 'Admin', path: '/admin', iconName: 'AdminPanelSettings' }
  ]
};

// Mock Documents Data
export const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Technical Specifications for Data Processing System',
    division: 'Engineering',
    documentNature: 'Technical Report',
    lastModified: '2025-05-27',
    size: '2.4 MB',
    views: 156,
    status: 'Active' as const
  },
  {
    id: '2',
    title: 'Q1 Financial Performance Analysis',
    division: 'Finance',
    documentNature: 'Financial Report',
    lastModified: '2025-05-26',
    size: '1.8 MB',
    views: 89,
    status: 'Active' as const
  },
  {
    id: '3',
    title: 'Employee Training Guidelines 2025',
    division: 'Human Resources',
    documentNature: 'Policy Document',
    lastModified: '2025-05-25',
    size: '945 KB',
    views: 234,
    status: 'Draft' as const
  },
  {
    id: '4',
    title: 'Marketing Campaign Strategy',
    division: 'Marketing',
    documentNature: 'Project Plan',
    lastModified: '2025-05-24',
    size: '3.1 MB',
    views: 67,
    status: 'Active' as const
  }
];
