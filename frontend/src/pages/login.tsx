import Link from "next/link";
import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useRouter } from "next/router";

export default function Login(props: { setToken: (arg0: any) => void; }) {
  // const {store, action} = useContext(Constext);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  let token;
if (typeof window !== 'undefined') {
  token = sessionStorage.getItem('token');
}

const handleSubmit = async (event: { preventDefault: () => void; }) => {
  event.preventDefault();

  try {
    const response = await axios.post("http://127.0.0.1:5000/auth/login", {
      email,
      password
    }, { withCredentials: true });

    const user_id = response.data.user_id; // Assuming the server returns user_id
    console.log("User ID:", user_id); // Log the user id
    console.log(response.data.access_token);
    sessionStorage.setItem('token', response.data.access_token);
    router.push('/');
    setShowSuccessAlert(true);
    setShowErrorAlert(false);
  } catch (error) {
    console.error("Error during login:", error);
    if (error.response && error.response.status === 401) {
      setShowErrorAlert(true);
      setShowSuccessAlert(false);
    }
  }
};

  return (
    <div>
      {showSuccessAlert && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You have successfully logged in.
          </AlertDescription>
        </Alert>
      )}
      {showErrorAlert && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            The password you entered is incorrect.
          </AlertDescription>
        </Alert>
      )}
    
    {
    token && token !== 'undefined' ? <div>
      <h1>You are already logged in</h1>
      <Button onClick={() => {
        sessionStorage.removeItem('token')
        router.push('/');
      }}>Logout</Button>
    </div> :
    <Card className="mx-auto max-w-sm mt-20">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
          {/* <Button variant="outline" className="w-full">
            Login with Google
          </Button> */}
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
    }
    
    </div>
  );
}
