"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  PiPencilLine,
  PiRocket,
  PiSignOut,
  PiUsers,
} from "react-icons/pi";
import userImg from "@/public/images/user.png";
import useModalOpen from "@/hooks/useModalOpen";
import { useMainModal } from "@/stores/modal";
import { authService } from "@/app/auth/authService";
import { useRouter } from "next/navigation";

// User type to match backend response
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

function UserModal() {
  const { modalOpen } = useMainModal();
  const { modal, setModal, modalRef } = useModalOpen();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    if (isClient) {
      const userData = authService.getUser();
      if (userData) {
        setUser(userData);
      }
    }
  }, [isClient]);

  const handleLogout = () => {
    authService.logout();
    setModal(false);
    router.push('/auth/login');
  };

  // Only render the complete component on the client
  if (!isClient) {
    return (
      <div className="relative size-9" ref={modalRef}>
        <div className="size-9 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="relative size-9 mt-0.5 sm:mt-1" ref={modalRef}>
      <button onClick={() => setModal((prev) => !prev)} className="w-full h-full flex items-center justify-center rounded-full overflow-hidden">
        <Image
          src={user?.avatar_url ? user.avatar_url : userImg}
          alt={user?.username || "User"}
          width={36}
          height={36}
          className="rounded-full object-cover w-full h-full"
        />
      </button>
      <div
        className={`absolute top-12 right-0 bg-white border border-primaryColor/30 p-3 rounded-xl text-sm duration-300 z-30 text-n500 dark:text-n30 w-[240px] ${
          modal
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-2 opacity-0"
        } `}
      >
        <ul className={`flex flex-col gap-1 justify-start items-start`}>
          <li className="flex justify-start items-center gap-2 p-3 border-b border-primaryColor/30 cursor-pointer w-full">
            <Image 
              src={user?.avatar_url ? user.avatar_url : userImg} 
              alt={user?.username || "User"} 
              width={28}
              height={28}
              className="size-7 rounded-full" 
            />
            <span className="">{user?.full_name || user?.username || "User"}</span>
          </li>
          <li
            className="flex justify-start items-center gap-2 p-3 rounded-lg border border-transparent hover:border-primaryColor/30 hover:bg-primaryColor/5 duration-300 cursor-pointer w-full"
            onClick={() => {
              modalOpen("Edit Profile");
              setModal(false);
            }}
          >
            <PiPencilLine className="text-xl" />
            <span className="">Edit Profile</span>
          </li>
          <li>
            <Link
              href={"/collaboration"}
              onClick={() => setModal(false)}
              className="flex justify-start items-center gap-2 p-3 rounded-lg border border-transparent hover:border-primaryColor/30 hover:bg-primaryColor/5 duration-300 cursor-pointer w-full"
            >
              <PiUsers className="text-xl" />
              <span className="">UniHub Community</span>
            </Link>
          </li>
          <li className="w-full">
            <Link
              href={"/upgrade"}
              onClick={() => setModal(false)}
              className="flex justify-start items-center gap-2 p-3 rounded-lg border border-transparent hover:border-primaryColor/30 hover:bg-primaryColor/5 duration-300 cursor-pointer w-full"
            >
              <PiRocket className="text-xl" />
              <span className="">Upgrade Plan</span>
            </Link>
          </li>
          <li className="w-full">
            <button
              onClick={handleLogout}
              className="flex justify-start items-center gap-2 p-3 rounded-lg border border-transparent hover:border-errorColor/30 hover:bg-errorColor/5 duration-300 cursor-pointer w-full text-errorColor"
            >
              <PiSignOut className="text-xl" />
              <span className="">Log Out</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserModal;
