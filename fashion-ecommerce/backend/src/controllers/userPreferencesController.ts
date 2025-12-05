import { Response } from 'express';
import mongoose from 'mongoose';
import UserPreferences from '../models/UserPreferences';
import { AuthRequest } from '../middleware/auth';

// @desc    Get user preferences
// @route   GET /api/user-preferences
// @access  Private
export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  // Full try/catch wrapper - ensure nothing throws unhandled
  try {
    // Check database connection first
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

    // If preferences don't exist, create default ones
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
    // API ERROR - Always return clean JSON response
    console.error('API ERROR:', error?.message || error?.toString() || 'Unknown error');
    
    return res.status(500).json({
      success: false,
      message: error?.message || 'Internal Server Error',
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/user-preferences
// @access  Private
export const updateUserPreferences = async (req: AuthRequest, res: Response) => {
  // Full try/catch wrapper - ensure nothing throws unhandled
  try {
    // Check database connection first
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

    // FIXED: Sanitize dashboardPreferences to ensure chartSettings and tableSettings are objects
    if (updateData.dashboardPreferences) {
      // Ensure chartSettings is an object, not undefined
      if (updateData.dashboardPreferences.chartSettings === undefined || 
          typeof updateData.dashboardPreferences.chartSettings !== 'object' ||
          updateData.dashboardPreferences.chartSettings === null) {
        updateData.dashboardPreferences.chartSettings = {};
      }
      
      // Ensure tableSettings is an object, not undefined
      if (updateData.dashboardPreferences.tableSettings === undefined || 
          typeof updateData.dashboardPreferences.tableSettings !== 'object' ||
          updateData.dashboardPreferences.tableSettings === null) {
        updateData.dashboardPreferences.tableSettings = {};
      }
    }

    // Helper function to remove undefined values from object
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

    // Clean updateData to remove undefined values
    const cleanedUpdateData = removeUndefined(updateData);

    // Validate that we have data to update
    if (!cleanedUpdateData || (typeof cleanedUpdateData === 'object' && Object.keys(cleanedUpdateData).length === 0)) {
      // Return current preferences instead of error (preferences saving is not critical)
      try {
        const currentPreferences = await UserPreferences.findOne({ user: userId });
        if (currentPreferences) {
          return res.status(200).json({
            success: true,
            message: 'No changes to update',
            data: currentPreferences,
          });
        }
        // If no preferences exist, create default ones
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
      // Creating new preferences
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
      // Updating existing preferences
      try {
        // Merge existing preferences with new data
        if (cleanedUpdateData.dashboardPreferences) {
          const existingDashboard = preferences.dashboardPreferences || {};
          const newDashboard = cleanedUpdateData.dashboardPreferences;
          
          preferences.dashboardPreferences = {
            ...existingDashboard,
            activeTab: newDashboard.activeTab !== undefined ? newDashboard.activeTab : existingDashboard.activeTab,
          };
          
          // FIXED: Merge chartSettings - ensure it's always an object
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
            // Ensure chartSettings exists even if not provided
            if (!preferences.dashboardPreferences.chartSettings) {
              preferences.dashboardPreferences.chartSettings = {
                revenueChartType: 'bar',
                ordersChartType: 'pie',
                dateRange: '30d',
              };
            }
          }
          
          // FIXED: Merge tableSettings - ensure it's always an object
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
            // Ensure tableSettings exists even if not provided
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

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error: any) {
    // API ERROR - Always return clean JSON response
    // Never throw unhandled exceptions
    console.error('API ERROR:', error?.message || error?.toString() || 'Unknown error');
    
    // Safely extract error message
    let errorMessage = 'Internal Server Error';
    try {
      errorMessage = error?.message || error?.toString() || 'Internal Server Error';
    } catch {
      errorMessage = 'Internal Server Error';
    }
    
    // Always return clean JSON response
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

