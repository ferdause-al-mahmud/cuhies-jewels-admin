/* eslint-disable react/display-name */
// lib/PrivateRoute.js
"use client";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import { auth } from "../firebase/firebase.config";
import { useRouter } from "next/navigation";
import Loader from "../Components/loader/Loader";

const privateRoute = (WrappedComponent) => {
  return (props) => {
    const [user, loading, signOut] = useAuthState(auth);
    const Router = useRouter();

    useEffect(() => {
      const checkUser = async () => {
        if (!loading && !user) {
          Router.replace("/");
        }
      };
      checkUser();
    }, [user, loading, Router, signOut]);

    if (loading || !user) {
      return <Loader />;
    }

    if (user) {
      return <WrappedComponent {...props} user={user} />;
    }

    return null;
  };
};

export default privateRoute;
