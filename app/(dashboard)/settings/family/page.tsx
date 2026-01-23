import { getFamilyDetails, generateInviteCode } from "@/app/actions/family"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, Users, ShieldPlus, Building2 } from "lucide-react"
import { InviteCodeDisplay } from "./invite-code-display"
import { AdminInviteGenerator } from "./admin-invite-generator"
import { PromoteAdminForm } from "./promote-admin-form"
import { DemoteAdminButton } from "./demote-admin-button"
import { UserRoleSelector } from "./user-role-selector"
import { OrganizationSettings } from "@/components/settings/OrganizationSettings"

import { redirect } from "next/navigation"

import { PendingMembersList } from "./pending-members-list"

export default async function FamilySettingsPage() {
    const { organizationName, inviteCode, inviteCodeExpiresAt, members, currentUserRole, isCurrentUserOwner, currentUserId } = await getFamilyDetails()

    if (currentUserRole !== 'ADMIN') {
        redirect("/settings")
    }

    const activeMembers = members.filter(m => m.status === 'ACTIVE' || !m.status) // Handle legacy null status as active
    const pendingMembers = members.filter(m => m.status === 'PENDING')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Organization & Family</h1>
                    <p className="text-muted-foreground">Manage your organization details and family members.</p>
                </div>
            </div>

            {/* Organization Name Settings */}
            <OrganizationSettings initialName={organizationName || "Your Space"} />

            {currentUserRole === 'ADMIN' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Invite Members
                        </CardTitle>
                        <CardDescription>
                            Share this code with your family members. They can enter it when signing up to join.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InviteCodeDisplay initialCode={inviteCode} expiresAt={inviteCodeExpiresAt} />
                    </CardContent>
                </Card>
            )}

            <PendingMembersList members={pendingMembers} />

            {currentUserRole === 'ADMIN' && (
                <Card className="border-yellow-500/20 bg-yellow-500/5 dark:bg-yellow-500/10 dark:border-yellow-500/10">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                            <ShieldPlus className="h-5 w-5" />
                            Invite Co-Admin
                        </CardTitle>
                        <CardDescription className="text-yellow-700/80 dark:text-yellow-500/80">
                            Generate a special code to add another Admin (e.g., Spouse) to your family group. This grants full control.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminInviteGenerator />
                    </CardContent>
                </Card>
            )}

            {currentUserRole !== 'ADMIN' && (
                <PromoteAdminForm />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Family Members</CardTitle>
                    <CardDescription>
                        People who have access to this family account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        {/* Allow any Admin to edit roles of others (except themselves) */}
                                        {currentUserRole === 'ADMIN' && member.id !== currentUserId ? (
                                            <UserRoleSelector
                                                userId={member.id}
                                                currentRole={member.role}
                                            />
                                        ) : (
                                            <Badge variant={member.role === 'ADMIN' ? "default" : "secondary"}>
                                                {member.role}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            {new Date(member.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
