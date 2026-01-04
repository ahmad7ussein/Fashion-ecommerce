"use client";
import { useEffect, useState } from "react";
import { roleAssignmentsApi } from "@/lib/api/roleAssignments";
import { partnersApi } from "@/lib/api/partners";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
const emptyForm = {
    email: "",
    role: "service_provider",
    partnerStoreId: "",
    notes: "",
};
export default function RoleAssignmentsPage() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [stores, setStores] = useState([]);
    const [form, setForm] = useState({ ...emptyForm });
    const [message, setMessage] = useState(null);
    const loadData = async () => {
        const [assignmentsData, storesData] = await Promise.all([
            roleAssignmentsApi.getAssignments(),
            partnersApi.getPartnerStores(),
        ]);
        setAssignments(assignmentsData);
        setStores(storesData);
    };
    useEffect(() => {
        loadData();
    }, []);
    if (!user || user.role !== "admin") {
        return <div className="p-6">Access restricted.</div>;
    }
    const handleSubmit = async () => {
        setMessage(null);
        try {
            await roleAssignmentsApi.createAssignment({
                role: form.role,
                email: form.email,
                partnerStoreId: form.role === "partner" ? form.partnerStoreId : undefined,
                notes: form.notes,
            });
            setForm({ ...emptyForm });
            await loadData();
            setMessage("Role assignment saved.");
        }
        catch (error) {
            setMessage(error?.message || "Failed to save assignment");
        }
    };
    const toggleStatus = async (assignment) => {
        const nextStatus = assignment.status === "active" ? "disabled" : "active";
        await roleAssignmentsApi.updateAssignmentStatus(assignment._id, { status: nextStatus });
        await loadData();
    };
    return (<div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="User email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/>
            <select className="h-10 rounded-md border px-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="service_provider">Service Provider</option>
              <option value="partner">Partner</option>
            </select>
            {form.role === "partner" && (<select className="h-10 rounded-md border px-3" value={form.partnerStoreId} onChange={(event) => setForm({ ...form, partnerStoreId: event.target.value })}>
                <option value="">Select partner store</option>
                {stores.map((store) => (<option key={store._id} value={store._id}>
                    {store.name}
                  </option>))}
              </select>)}
            <Textarea placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}/>
          </div>
          <Button onClick={handleSubmit}>Assign Role</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (<TableRow key={assignment._id}>
                  <TableCell>
                    {typeof assignment.user === "string"
                ? assignment.user
                : `${assignment.user.firstName} ${assignment.user.lastName}`}
                  </TableCell>
                  <TableCell>{assignment.role}</TableCell>
                  <TableCell>{assignment.status}</TableCell>
                  <TableCell>
                    {assignment.partnerStore && typeof assignment.partnerStore !== "string"
                ? assignment.partnerStore.name
                : "-"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(assignment)}>
                      {assignment.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
