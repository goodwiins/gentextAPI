import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"

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
  Image, 
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
  EyeOff,
  Zap,
  Clock,
  Settings,
  ChevronRight
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const { authState, logout } = useAuthContext()
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
    theme: 'system',
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

  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push("/login")
    }
  }, [authState, router])

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
  }
  
  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updatedPrefs = await account.updatePrefs({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        avatar: formData.avatar,
        // Add new preferences
        notifications,
        appearance,
        language,
        privacy
      })

      // Refresh the page to update the user data
      router.reload()
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation items for the sidebar
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="min-h-[calc(100vh_-_theme(spacing.16))] w-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <main className="container mx-auto py-10 px-4 md:px-6">
        <motion.div 
          className="flex flex-col gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Settings</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="hidden md:flex items-center gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Settings Sidebar */}
            <motion.div 
              className="w-full md:w-64 bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 h-fit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg">Settings</h2>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as SettingsSection)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {activeSection === item.id && (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </motion.div>

            {/* Settings Content */}
            <div className="flex-1">
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Profile Settings</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage your account settings and profile information.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name</Label>
                            <div className="relative">
                              <Input
                                id="firstName"
                                name="firstName"
                                placeholder="Enter your first name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="pl-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                              />
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name</Label>
                            <div className="relative">
                              <Input
                                id="lastName"
                                name="lastName"
                                placeholder="Enter your last name"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="pl-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                              />
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              disabled
                              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your email address cannot be changed.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avatar" className="text-gray-700 dark:text-gray-300">Profile Picture URL</Label>
                          <div className="relative">
                            <Input
                              id="avatar"
                              type="text"
                              placeholder="Enter image URL for your profile picture"
                              value={formData.avatar}
                              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                              className="pl-10"
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter a valid image URL to update your profile picture.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            {isLoading ? (
                              <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage how and when you receive notifications.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Email Notifications</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">Quiz Reminders</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">Weekly Digest</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">Sound Effects</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  </Card>
                </motion.div>
              )}
              
              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Appearance</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Customize the look and feel of the application.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-base">Theme</Label>
                          <Select 
                            value={appearance.theme} 
                            onValueChange={(value) => handleAppearanceChange('theme', value)}
                          >
                            <SelectTrigger className="w-full">
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
                                  <Zap className="mr-2 h-4 w-4" />
                                  <span>System</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-base">Font Size</Label>
                            <span className="text-sm text-gray-500">{appearance.fontSize}px</span>
                          </div>
                          <Slider 
                            value={[appearance.fontSize]} 
                            min={12} 
                            max={20} 
                            step={1}
                            onValueChange={(value: number[]) => handleAppearanceChange('fontSize', value[0])}
                            className="py-2"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Reduce Animations</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">High Contrast</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  </Card>
                </motion.div>
              )}
              
              {/* Language & Region Settings */}
              {activeSection === 'language' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Language & Region</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Set your preferred language and regional settings.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-base">Language</Label>
                          <Select 
                            value={language} 
                            onValueChange={setLanguage}
                          >
                            <SelectTrigger className="w-full">
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
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base">Time Format</Label>
                          <Select defaultValue="12h">
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select time format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                              <SelectItem value="24h">24-hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base">Date Format</Label>
                          <Select defaultValue="mm/dd/yyyy">
                            <SelectTrigger className="w-full">
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
                  </Card>
                </motion.div>
              )}
              
              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Privacy</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Control your privacy settings and data visibility.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Show Profile</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">Show History</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            <Label className="text-base">Show Stats</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Display your statistics on your profile
                            </p>
                          </div>
                          <Switch 
                            checked={privacy.showStats}
                            onCheckedChange={(checked: boolean) => handlePrivacyChange('showStats', checked)}
                          />
                        </div>
                        
                        <div className="pt-2">
                          <Button variant="outline" className="w-full">
                            <Clock className="mr-2 h-4 w-4" />
                            Data Retention Settings
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              
              {/* Security Settings */}
              {activeSection === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <CardTitle className="text-xl font-bold">Security</CardTitle>
                          <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage your account security settings.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Add an extra layer of security to your account.
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          disabled
                          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                        >
                          Coming Soon
                        </Button>
                      </div>
                      <Separator className="bg-gray-200 dark:bg-gray-700" />
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-red-600 dark:text-red-500">Delete Account</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Permanently delete your account and all data.
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => toast.error('This feature is not available yet')}
                          className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
