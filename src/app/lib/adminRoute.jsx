import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase.config";
import { signOut } from "firebase/auth";
import Loader from "@/app/Components/loader/Loader";

const withAuth = (WrappedComponent) => {
  const WithAuthComponent = (props) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [user, userLoading] = useAuthState(auth);

    useEffect(() => {
      if (userLoading) return;

      // No user → send to login
      if (!user) {
        router.push("/");
        setLoading(false);
        return;
      }

      // User exists → check role
      const checkUserRole = async () => {
        try {
          const { data } = await axios.get(`/api/role?email=${user.email}`);

          if (data.role === "admin" || data.role === "moderator") {
            setIsAuthorized(true);
          } else {
            // Not authorized → sign out + redirect
            await signOut(auth);
            router.push("/unauthorized");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          await signOut(auth);
          router.push("/unauthorized");
        } finally {
          setLoading(false);
        }
      };

      checkUserRole();
    }, [router, user, userLoading]);

    if (loading || userLoading) {
      return <Loader />;
    }

    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };

  WithAuthComponent.displayName = `WithAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithAuthComponent;
};

export default withAuth;
