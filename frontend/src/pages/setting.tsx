import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { toast } from "react-hot-toast"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/Icons"
import { useAuthContext } from "@/context/auth-context"
import { account } from "@/lib/appwrite"
import { Models } from "appwrite"
import {
  User,
  Mail,
  Lock,
  Trash2,
  ArrowLeft,
  Save,
  Shield,
  Key,
  Bell,
  Moon,
  Sun,
  Globe,
  Palette,
  Eye,
  Zap,
  Clock,
  Settings,
  ChevronRight,
  Monitor,
  Smartphone
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import PhoneSetup from "@/components/auth/phone-setup"
import MfaSettings from "@/components/auth/mfa-settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackgroundBeams } from "@/components/ui/background-beams"

interface FormData {
  firstName: string
  lastName: string
  email: string
  avatar: string
}

interface AuthState {
  user: Models.User<Models.Preferences> | null
  prefs: Models.Preferences
}

// Define settings sections
type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'language' | 'privacy' | 'security'

export default function Setting() {
  const router = useRouter()
  const { authState, logout, listSessions, deleteSession, extendSession } = useAuthContext()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [formData, setFormData] = useState<FormData>({
    firstName: authState.user?.prefs?.FirstName || '',
    lastName: authState.user?.prefs?.LastName || '',
    email: authState.user?.email || '',
    avatar: authState.user?.prefs?.avatar || ''
  })
  
  // New state for additional settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    quizReminders: true,
    weeklyDigest: false,
    soundEffects: true
  })
  
  const [appearance, setAppearance] = useState({
    theme: theme || 'system',
    fontSize: 16,
    reduceAnimations: false,
    highContrast: false
  })
  
  const [language, setLanguage] = useState('en')
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showHistory: true,
    showStats: true
  })

  // Security state
  const [securityPassword, setSecurityPassword] = useState<string>('')
  const [sessions, setSessions] = useState<any>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)

  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push("/login")
    }
  }, [authState, router])

  useEffect(() => {
    // Update local appearance state when global theme changes
    if (theme) {
      setAppearance(prev => ({ ...prev, theme }))
    }
  }, [theme])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  const handleAppearanceChange = (key: string, value: any) => {
    setAppearance(prev => ({
      ...prev,
      [key]: value
    }))
    
    // If changing theme, also update global theme
    if (key === 'theme') {
      setTheme(value)
    }
  }
  
  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Security handlers
  const handlePhoneSetupSuccess = () => {
    toast.success('Phone number verified successfully!')
    setSecurityPassword('')
  }

  const handlePhoneSetupError = (error: string) => {
    toast.error(error)
  }

  // Device management handlers
  const loadSessions = async () => {
    if (!authState.user) return
    
    setSessionsLoading(true)
    try {
      const sessionData = await listSessions()
      setSessions(sessionData)
    } catch (error: any) {
      console.error('Failed to load sessions:', error)
      toast.error('Failed to load devices')
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      toast.success('Device removed successfully')
      await loadSessions() // Reload the sessions list
    } catch (error: any) {
      console.error('Failed to delete session:', error)
      toast.error(error.message || 'Failed to remove device')
    }
  }

  const handleExtendSession = async (sessionId: string) => {
    try {
      await extendSession(sessionId)
      toast.success('Session extended successfully')
      await loadSessions() // Reload to show updated expiry
    } catch (error: any) {
      console.error('Failed to extend session:', error)
      toast.error(error.message || 'Failed to extend session')
    }
  }

  // Load sessions when security section is activated
  useEffect(() => {
    if (activeSection === 'security' && authState.user && !sessions) {
      loadSessions()
    }
  }, [activeSection, authState.user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!authState.user || !authState.session) {
      toast.error('Your session has expired. Please log in again.')
      router.push('/login')
      return
    }

    setIsLoading(true)

    try {
      // Verify session is still valid before updating
      try {
        const session = await account.getSession('current');
        if (!session) {
          throw new Error('Your session has expired. Please log in again.');
        }
      } catch (sessionError: any) {
        if (sessionError?.message?.includes('missing scopes') ||
            sessionError?.message?.includes('guests') ||
            sessionError?.type === 'user_unauthorized') {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw sessionError;
      }

      // Update user preferences in Appwrite
      await account.updatePrefs({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        avatar: formData.avatar,
        // Add new preferences
        notifications,
        appearance,
        language,
        privacy
      })

      toast.success('Profile updated successfully')

      // Refresh the page to update the user data
      setTimeout(() => {
        router.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Error updating profile:', error)

      // Handle session expiration
      if (error?.message?.includes('session has expired') ||
          error?.message?.includes('missing scopes') ||
          error?.message?.includes('guests') ||
          error?.type === 'user_unauthorized') {
        toast.error('Your session has expired. Please log in again.')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
        return
      }

      const errorMessage = error?.message || 'Failed to update profile'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation items for the sidebar
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Manage your account' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Customize theme' },
    { id: 'language', label: 'Language & Region', icon: Globe, description: 'Region settings' },
    { id: 'privacy', label: 'Privacy', icon: Eye, description: 'Control visibility' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Protect your account' },
  ]

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const firstName = formData.firstName || authState.user?.name?.split(' ')[0] || ''
    const lastName = formData.lastName || authState.user?.name?.split(' ')[1] || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Beams - Subtle and behind content */}
      <BackgroundBeams className="absolute inset-0 z-0 opacity-30 dark:opacity-20" />

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10">
        <div className="container flex h-16 items-center px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container flex flex-col md:flex-row gap-8 py-8 px-6 relative z-10">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 text-left">
                    <div>{item.label}</div>
                    <div className="text-xs text-muted-foreground font-normal hidden md:block">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl">
          <div className="space-y-6">
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your public profile information
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and how others see you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 border-2">
                          <AvatarImage src={formData.avatar} alt={`${formData.firstName} ${formData.lastName}`} />
                          <AvatarFallback className="text-lg font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">Profile Picture</h3>
                          <p className="text-sm text-muted-foreground">
                            Update your avatar to personalize your profile
                          </p>
                        </div>
                      </div>

                      <Separator />


                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="grid gap-3">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid gap-3">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-sm text-muted-foreground">
                            Email cannot be changed
                          </p>
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="avatar">Profile Picture URL</Label>
                          <Input
                            id="avatar"
                            type="url"
                            placeholder="https://example.com/avatar.jpg"
                            value={formData.avatar}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                          />
                          <p className="text-sm text-muted-foreground">
                            Provide a URL to your profile picture
                          </p>
                        </div>
                      </form>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button onClick={handleUpdateProfile} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage how and when you receive notifications
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Configure your notification settings and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            checked={notifications.emailNotifications}
                            onCheckedChange={(checked: boolean) => handleNotificationChange('emailNotifications', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Quiz Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                              Get reminders about your quizzes
                            </p>
                          </div>
                          <Switch
                            checked={notifications.quizReminders}
                            onCheckedChange={(checked: boolean) => handleNotificationChange('quizReminders', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Weekly Digest</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive a weekly summary of your activity
                            </p>
                          </div>
                          <Switch
                            checked={notifications.weeklyDigest}
                            onCheckedChange={(checked: boolean) => handleNotificationChange('weeklyDigest', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Sound Effects</Label>
                            <p className="text-sm text-muted-foreground">
                              Play sounds for notifications
                            </p>
                          </div>
                          <Switch
                            checked={notifications.soundEffects}
                            onCheckedChange={(checked: boolean) => handleNotificationChange('soundEffects', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Appearance</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customize the look and feel of the application
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Display Settings</CardTitle>
                      <CardDescription>
                        Personalize your visual experience and accessibility options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-3">
                        <Label>Theme</Label>
                        <Select
                          value={appearance.theme}
                          onValueChange={(value) => handleAppearanceChange('theme', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center">
                                <Sun className="mr-2 h-4 w-4" />
                                <span>Light</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center">
                                <Moon className="mr-2 h-4 w-4" />
                                <span>Dark</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center">
                                <Monitor className="mr-2 h-4 w-4" />
                                <span>System</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred color theme
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <div className="flex justify-between">
                          <Label>Font Size</Label>
                          <span className="text-sm text-muted-foreground">{appearance.fontSize}px</span>
                        </div>
                        <Slider
                          value={[appearance.fontSize]}
                          min={12}
                          max={20}
                          step={1}
                          onValueChange={(value: number[]) => handleAppearanceChange('fontSize', value[0])}
                          className="py-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          Adjust text size for better readability
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Reduce Animations</Label>
                            <p className="text-sm text-muted-foreground">
                              Minimize motion and animations
                            </p>
                          </div>
                          <Switch
                            checked={appearance.reduceAnimations}
                            onCheckedChange={(checked: boolean) => handleAppearanceChange('reduceAnimations', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">High Contrast</Label>
                            <p className="text-sm text-muted-foreground">
                              Increase contrast for better visibility
                            </p>
                          </div>
                          <Switch
                            checked={appearance.highContrast}
                            onCheckedChange={(checked: boolean) => handleAppearanceChange('highContrast', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Language & Region Settings */}
              {activeSection === 'language' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Language & Region</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set your preferred language and regional settings
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Regional Preferences</CardTitle>
                      <CardDescription>
                        Configure language and format options for your region
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-3">
                        <Label>Language</Label>
                        <Select
                          value={language}
                          onValueChange={setLanguage}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="ja">日本語</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred display language
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-3">
                          <Label>Time Format</Label>
                          <Select defaultValue="12h">
                            <SelectTrigger>
                              <SelectValue placeholder="Select time format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                              <SelectItem value="24h">24-hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-3">
                          <Label>Date Format</Label>
                          <Select defaultValue="mm/dd/yyyy">
                            <SelectTrigger>
                              <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                              <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                              <SelectItem value="yyyy/mm/dd">YYYY/MM/DD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Privacy</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Control your privacy settings and data visibility
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Controls</CardTitle>
                      <CardDescription>
                        Manage what information is visible to others
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Show Profile</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <Switch
                            checked={privacy.showProfile}
                            onCheckedChange={(checked: boolean) => handlePrivacyChange('showProfile', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Show History</Label>
                            <p className="text-sm text-muted-foreground">
                              Display your quiz history on your profile
                            </p>
                          </div>
                          <Switch
                            checked={privacy.showHistory}
                            onCheckedChange={(checked: boolean) => handlePrivacyChange('showHistory', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base font-medium">Show Stats</Label>
                            <p className="text-sm text-muted-foreground">
                              Display your statistics on your profile
                            </p>
                          </div>
                          <Switch
                            checked={privacy.showStats}
                            onCheckedChange={(checked: boolean) => handlePrivacyChange('showStats', checked)}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Button variant="outline" className="w-full">
                          <Clock className="mr-2 h-4 w-4" />
                          Data Retention Settings
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Protect your account with enhanced security features
                    </p>
                  </div>

                  {/* Phone Setup Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Phone Verification</CardTitle>
                      <CardDescription>
                        Add and verify your phone number for two-factor authentication
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <PhoneSetup
                        password={securityPassword}
                        onSuccess={handlePhoneSetupSuccess}
                        onError={handlePhoneSetupError}
                      />
                      {!securityPassword && (
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <p className="text-sm text-muted-foreground">
                            <strong>Tip:</strong> Enter your account password above to update your phone number.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* MFA Settings Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Manage SMS-based two-factor authentication for enhanced security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <MfaSettings userId={authState.user?.$id} />
                    </CardContent>
                  </Card>

                  {/* Device Management Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Device Management</CardTitle>
                          <CardDescription>
                            Manage devices that have access to your account
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSessions}
                          disabled={sessionsLoading}
                        >
                          {sessionsLoading ? (
                            <Icons.Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icons.RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {sessionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Icons.Loader className="h-6 w-6 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading devices...</span>
                        </div>
                      ) : sessions && sessions.sessions && sessions.sessions.length > 0 ? (
                        <div className="space-y-3">
                          {sessions.sessions.map((session: any) => (
                            <div
                              key={session.$id}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                session.current
                                  ? 'bg-accent/50 border-border'
                                  : 'bg-muted/30 border-border'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-background border">
                                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm">
                                      {session.current ? 'Current Device' : 'Other Device'}
                                    </h4>
                                    {session.current && (
                                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(session.expire).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Monitor className="h-3 w-3" />
                                      {session.clientName || 'Unknown Device'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!session.current && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExtendSession(session.$id)}
                                    >
                                      Extend
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteSession(session.$id)}
                                      className="text-destructive hover:bg-destructive/10"
                                    >
                                      Remove
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">
                            No devices found
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            No active sessions found for your account
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div className="rounded-lg border bg-muted/50 p-4">
                        <h4 className="font-medium mb-2">
                          Remember Device Feature
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          When you enable &quot;Remember this device&quot; during MFA login, your session will be extended and you won&apos;t need to enter MFA codes as frequently on this device.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Use the &quot;Extend&quot; button to prolong trusted device sessions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone Card */}
                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      <CardDescription>
                        Irreversible and destructive actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Delete Account</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => toast.error('This feature is not available yet')}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
      </div>
    </div>
  )
}
