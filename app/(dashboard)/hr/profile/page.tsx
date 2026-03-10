"use client"

import { useEffect, useState } from "react"
import { getEmployeeProfile, createOrUpdateProfile } from "@/app/actions/hr"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getEmployeeProfile().then(p => {
            setProfile(p || {})
            setLoading(false)
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const data = new FormData(e.target as HTMLFormElement)
        await createOrUpdateProfile({
            jobTitle: data.get("jobTitle") as string,
            department: data.get("department") as string,
            emergencyContact: data.get("emergencyContact") as string,
        })
        alert("Profile updated!")
    }

    if (loading) return <div className="p-8">Loading profile...</div>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Employee Profile</h1>
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your job details and emergency contact.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Job Title</label>
                            <Input name="jobTitle" defaultValue={profile?.jobTitle || ""} className="bg-background" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <Input name="department" defaultValue={profile?.department || ""} className="bg-background" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Emergency Contact</label>
                            <Input name="emergencyContact" defaultValue={profile?.emergencyContact || ""} className="bg-background" />
                        </div>
                        <Button type="submit" className="mt-4">Update Profile</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
