import { Response } from 'express';
import mongoose from 'mongoose';
import UserPreferences from '../models/UserPreferences';
import { AuthRequest } from '../middleware/auth';




export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  
  try {
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    let preferences;
    try {
      preferences = await UserPreferences.findOne({ user: userId });
    } catch (dbError: any) {
      console.error('Database error in getUserPreferences:', dbError?.message || 'Unknown database error');
      return res.status(500).json({
        success: false,
        message: 'Database error occurred. Please try again later.',
      });
    }

    
    if (!preferences) {
      try {
        preferences = await UserPreferences.create({
          user: userId,
        });
      } catch (createError: any) {
        console.error('Error creating preferences:', createError?.message || 'Unknown error');
        return res.status(500).json({
          success: false,
          message: createError?.message || 'Failed to create preferences',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    
    console.error('API ERROR:', error?.message || error?.toString() || 'Unknown error');
    
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal Server Error',
    });
  }
};




export const updateUserPreferences = async (req: AuthRequest, res: Response) => {
  
  try {
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available. Please try again later.',
      });
    }

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const updateData = req.body;

    
    if (updateData.dashboardPreferences) {
      
      if (updateData.dashboardPreferences.chartSettings === undefined || 
          typeof updateData.dashboardPreferences.chartSettings !== 'object' ||
          updateData.dashboardPreferences.chartSettings === null) {
        updateData.dashboardPreferences.chartSettings = {};
      }
      
      
      if (updateData.dashboardPreferences.tableSettings === undefined || 
          typeof updateData.dashboardPreferences.tableSettings !== 'object' ||
          updateData.dashboardPreferences.tableSettings === null) {
        updateData.dashboardPreferences.tableSettings = {};
      }
    }

    
    const removeUndefined = (obj: any): any => {
      try {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) return obj.map(removeUndefined);
        if (typeof obj !== 'object') return obj;
        
        const cleaned: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            const cleanedValue = removeUndefined(obj[key]);
            if (cleanedValue !== undefined) {
              cleaned[key] = cleanedValue;
            }
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      } catch {
        return undefined;
      }
    };

    
    const cleanedUpdateData = removeUndefined(updateData);

    
    if (!cleanedUpdateData || (typeof cleanedUpdateData === 'object' && Object.keys(cleanedUpdateData).length === 0)) {
      
      try {
        const currentPreferences = await UserPreferences.findOne({ user: userId });
        if (currentPreferences) {
          return res.status(200).json({
            success: true,
            message: 'No changes to update',
            data: currentPreferences,
          });
        }
        
        const defaultPreferences = await UserPreferences.create({
          user: userId,
        });
        return res.status(200).json({
          success: true,
          message: 'Default preferences created',
          data: defaultPreferences,
        });
      } catch (createError: any) {
        return res.status(500).json({
          success: false,
          message: createError?.message || 'Failed to create default preferences',
        });
      }
    }

    let preferences;
    try {
      preferences = await UserPreferences.findOne({ user: userId });
    } catch (dbError: any) {
      console.error('Database error in updateUserPreferences (findOne):', dbError?.message || 'Unknown database error');
      return res.status(500).json({
        success: false,
        message: 'Database error occurred. Please try again later.',
      });
    }

    if (!preferences) {
      
      try {
        preferences = await UserPreferences.create({
          user: userId,
          ...cleanedUpdateData,
        });
      } catch (createError: any) {
        console.error('Error creating preferences:', createError?.message || 'Unknown error');
        return res.status(500).json({
          success: false,
          message: createError?.message || 'Failed to create preferences',
        });
      }
    } else {
      
      try {
        
        if (cleanedUpdateData.dashboardPreferences) {
          const existingDashboard = preferences.dashboardPreferences || {};
          const newDashboard = cleanedUpdateData.dashboardPreferences;
          
          preferences.dashboardPreferences = {
            ...existingDashboard,
            activeTab: newDashboard.activeTab !== undefined ? newDashboard.activeTab : existingDashboard.activeTab,
          };
          
          
          if (newDashboard.chartSettings && typeof newDashboard.chartSettings === 'object') {
            preferences.dashboardPreferences.chartSettings = {
              ...(existingDashboard.chartSettings || {
                revenueChartType: 'bar',
                ordersChartType: 'pie',
                dateRange: '30d',
              }),
              ...newDashboard.chartSettings,
            };
          } else {
            
            if (!preferences.dashboardPreferences.chartSettings) {
              preferences.dashboardPreferences.chartSettings = {
                revenueChartType: 'bar',
                ordersChartType: 'pie',
                dateRange: '30d',
              };
            }
          }
          
          
          if (newDashboard.tableSettings && typeof newDashboard.tableSettings === 'object') {
            preferences.dashboardPreferences.tableSettings = {
              ...(existingDashboard.tableSettings || {
                pageSize: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              }),
              ...newDashboard.tableSettings,
            };
          } else {
            
            if (!preferences.dashboardPreferences.tableSettings) {
              preferences.dashboardPreferences.tableSettings = {
                pageSize: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              };
            }
          }
        }
        
        if (cleanedUpdateData.sidebarPreferences) {
          preferences.sidebarPreferences = {
            ...(preferences.sidebarPreferences || {}),
            ...cleanedUpdateData.sidebarPreferences,
          };
        }
        
        if (cleanedUpdateData.theme !== undefined) {
          preferences.theme = cleanedUpdateData.theme;
        }
        
        if (cleanedUpdateData.language !== undefined) {
          preferences.language = cleanedUpdateData.language;
        }
        
        if (cleanedUpdateData.notifications) {
          preferences.notifications = {
            ...(preferences.notifications || {}),
            ...cleanedUpdateData.notifications,
          };
        }

        await preferences.save();
      } catch (saveError: any) {
        return res.status(500).json({
          success: false,
          message: saveError?.message || 'Failed to save preferences',
        });
      }
    }

    
    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error: any) {
    
    
    console.error('API ERROR:', error?.message || error?.toString() || 'Unknown error');
    
    
    let errorMessage = 'Internal Server Error';
    try {
      errorMessage = error?.message || error?.toString() || 'Internal Server Error';
    } catch {
      errorMessage = 'Internal Server Error';
    }
    
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

