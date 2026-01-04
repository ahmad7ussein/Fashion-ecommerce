import apiClient from "./client";
export const adminApi = {
    async getDashboardStats() {
        return await apiClient.get("/admin/dashboard/stats");
    },
    async getAllUsers(params) {
        const queryParams = new URLSearchParams();
        if (params?.role)
            queryParams.append("role", params.role);
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        if (params?.search)
            queryParams.append("search", params.search);
        const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
            return {
                data: response.data,
                total: response.total || 0,
                page: response.page || 1,
                pages: response.pages || 1,
            };
        }
        if (Array.isArray(response)) {
            return {
                data: response,
                total: response.length,
                page: 1,
                pages: 1,
            };
        }
        return {
            data: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    },
    async getUser(id) {
        return await apiClient.get(`/admin/users/${id}`);
    },
    async updateUserRole(id, role) {
        return await apiClient.put(`/admin/users/${id}/role`, { role });
    },
    async deleteUser(id) {
        return await apiClient.delete(`/admin/users/${id}`);
    },
    async createEmployee(employeeData) {
        const response = await apiClient.post("/admin/employees", employeeData);
        if (response && typeof response === 'object' && 'data' in response) {
            return response.data;
        }
        return response;
    },
    async getSalesReport(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate)
            params.append("startDate", startDate);
        if (endDate)
            params.append("endDate", endDate);
        const response = await apiClient.get(`/admin/reports/sales?${params.toString()}`);
        if (response && typeof response === 'object' && 'data' in response && 'salesByDay' in response.data) {
            return response.data;
        }
        return response;
    },
    async getEmployeeActivities(params) {
        const queryParams = new URLSearchParams();
        if (params?.employeeId)
            queryParams.append("employeeId", params.employeeId);
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        const response = await apiClient.get(`/admin/employee-activities?${queryParams.toString()}`);
        if (response && typeof response === 'object' && 'data' in response && 'statistics' in response) {
            return {
                data: Array.isArray(response.data) ? response.data : [],
                statistics: Array.isArray(response.statistics) ? response.statistics : [],
                total: response.total || 0,
                page: response.page || 1,
                pages: response.pages || 0,
            };
        }
        return {
            data: [],
            statistics: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    },
};
