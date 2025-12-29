import { Response, NextFunction } from 'express';
import RoleAssignment, { IRoleAssignment, RoleAssignmentType } from '../models/RoleAssignment';
import { AuthRequest } from './auth';

export interface RoleAuthRequest extends AuthRequest {
  roleAssignment?: IRoleAssignment;
}

export const requireRoleAssignment = (role: RoleAssignmentType) => {
  return async (req: RoleAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const assignment = await RoleAssignment.findOne({
      user: req.user._id,
      role,
      status: 'active',
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this role',
      });
    }

    req.roleAssignment = assignment;
    next();
  };
};
