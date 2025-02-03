"use client";
import React, { useEffect, useState } from "react";
import user from "@/public/images/user.png";
import Image from "next/image";
import InputFieldSecond from "@/components/ui/InputFieldSecond";
import TextArea from "@/components/ui/TextArea";
import { PiCloudArrowUp } from "react-icons/pi";
import SmallButtons from "@/components/ui/buttons/SmallButtons";
import { authService } from "@/app/auth/authService";
import Alert from "@/components/ui/Alert";

// User type to match backend response
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

function EditProfileModal() {
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Fetch user data on component mount
  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserData(user);
      
      // Split full name into first and last name
        const nameParts = user.full_name ? user.full_name.split(' ') : [];
        setFormData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(' ') || "",
          username: user.username || "",
          email: user.email || ""
        });
    }
  }, []);
  
  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        username: formData.username,
        email: formData.email
      };
      await authService.updateProfile(payload);

      if (userData) {
        const updatedUser = {
          ...userData,
          full_name: payload.fullName,
          username: payload.username,
          email: payload.email
        };
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setAlert({ message: "Profile updated successfully!", type: 'success' });
    } catch (error: any) {
      setAlert({ message: error.message || "Failed to update profile", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);
      try {
        const res = await authService.uploadAvatar(file);
        if (userData) {
          const updatedUser = { ...userData, avatar_url: res.avatar_url };
          setUserData(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser)); 
        }
        setAlert({ message: "Profile picture uploaded successfully!", type: 'success' });
      } catch (error: any) {
        setAlert({ message: error.message || "Failed to upload picture", type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (!userData) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="">
      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      
      <div className="flex justify-start items-center pb-6 gap-3">
        <div className="flex justify-center items-center relative border rounded-full border-primaryColor/30 p-1.5">
          <Image 
            src={userData.avatar_url ? userData.avatar_url : user}
            alt={userData.username || "User"}
            width={44}
            height={44}
            className="size-11 rounded-full object-cover" 
          />
          <label
            htmlFor="photo-upload"
            className="bg-white flex justify-center items-center absolute bottom-1 right-1 rounded-full p-0.5 cursor-pointer"
          >
            <PiCloudArrowUp />
            <input type="file" className="hidden" id="photo-upload" onChange={handleFileChange} />
          </label>
        </div>
        <div className="">
          <p className="text-sm font-medium">Profile Picture</p>
          <p className="text-xs pt-1 ">
            Choose an avatar or image that represents you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <InputFieldSecond
          className="col-span-12 sm:col-span-6"
          placeholder="First Name"
          title="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
        />
        <InputFieldSecond
          className="col-span-12 sm:col-span-6"
          placeholder="Last Name"
          title="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
        />
        <InputFieldSecond
          className="col-span-12"
          placeholder="Username"
          title="Username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        />
        <InputFieldSecond
          className="col-span-12"
          placeholder="Email address"
          title="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />

      </div>
      <div className="flex justify-start items-center gap-2 pt-5 text-xs">
        <SmallButtons 
          name={isLoading ? "Updating..." : "Update Now"} 
          fn={handleUpdateProfile}
        />
        <SmallButtons name="Cancel" secondary={true} />
      </div>
    </div>
  );
}

export default EditProfileModal;
