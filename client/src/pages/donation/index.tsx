import { useEffect } from "react";
import { useLocation } from "wouter";

export default function DonationIndexPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate("/donation-page");
  }, [navigate]);
  
  return null;
}