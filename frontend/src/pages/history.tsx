import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { fetchUserId } from '../utils/auth';// Adjust the import path based on your project structure

export default function history() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState(null);
  const [interactions, setInteractions] = useState([]);

  useEffect(() => {
    if (router.isReady) {
      fetchUserId().then(user_id => {

        if (user_id) {
          // Fetch user interactions
          axios
            .get(`http://127.0.0.1:5000/api/user/${user_id}/interactions`, {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('token')}`
              }
            })
            .then((response) => {
              console.log("User interactions:", response.data);
              sessionStorage.setItem('userData', JSON.stringify(response.data));
              setInteractions(response.data); // Store the interactions
            })
            .catch((error) => {
              console.error("Error fetching user interactions:", error);
            });
        }
      });
    }
  }, [router.isReady]);
}