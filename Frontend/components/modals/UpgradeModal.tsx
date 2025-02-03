import Image from "next/image";
import React, { useState } from "react";
import {
  PiCheckCircle,
  PiCreditCard,
  PiEnvelopeSimple,
  PiLockKey,
  PiX,
} from "react-icons/pi";
import upgradeImg from "@/public/images/upgrade-header.png";
import Link from "next/link";
import { useMainModal } from "@/stores/modal";

const pricingData = [
  {
    id: 1,
    title: "Pay monthly",
    price: "99/month",
  },
  {
    id: 2,
    title: "Pay yearly",
    price: "399/year",
  },
];

function UpgradeModal() {
  const [selectedPrice, setSelectedPrice] = useState(0);
  const { modalClose } = useMainModal();
  return (
    <div className="">
      <div className="relative">
        <Image src={upgradeImg} alt="" className="w-full" />
        <div
          onClick={modalClose}
          className="absolute top-4 right-4  rounded-full p-1 sm:p-2 flex justify-center items-center bg-white cursor-pointer dark:bg-n0"
        >
          <PiX className="text-errorColor text-xl sm:text-2xl" />
        </div>
      </div>
      <div className="px-4 sm:px-[60px] pb-6 sm:pb-10  ">
        <div className="bg-white relative z-10 rounded-xl">
          <div className="bg-secondaryColor/5 border border-secondaryColor/30 rounded-xl p-3 sm:py-5 sm:px-6 -mt-12">
            <p className="text-xl sm:text-2xl font-semibold">Premium</p>
            <p className="text-n700 pt-2 max-sm:text-sm dark:text-n30">
              $99.00/month/1 team member
            </p>
          </div>
          <div className="pt-3 flex justify-start items-center gap-2 sm:gap-3 max-[430px]:flex-col">
            {pricingData.map(({ id, title, price }, idx) => (
              <div
                className={`p-3 sm:p-5 rounded-xl flex-1 bg-primaryColor/5 border relative w-full ${
                  selectedPrice === idx
                    ? " border-primaryColor"
                    : "border-primaryColor/30"
                }`}
                key={id}
                onClick={() => setSelectedPrice(idx)}
              >
                <div
                  className={`absolute top-2 right-2 text-primaryColor ${
                    selectedPrice === idx ? "" : "opacity-0"
                  }`}
                >
                  <PiCheckCircle className="text-2xl" />
                </div>
                <p className="text-sm font-medium pb-2">{title}</p>
                <div className="flex justify-between items-center ">
                  <p className="font-semibold text-n700">
                    {price}
                  </p>
                  {idx === 1 && (
                    <p className="text-successColor bg-successColor/5 border border-successColor/30 rounded-md px-2 text-sm">
                      Save 20%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="py-5 border border-primaryColor/30 rounded-xl mt-10">
            <div className="flex flex-col gap-4 pb-5 px-5">
              <p className="text-sm font-medium">Billing email</p>
              <div className="flex justify-start items-center gap-3">
                <PiEnvelopeSimple className="text-2xl text-n100" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="outline-none w-full bg-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-primaryColor/30 px-5 pt-5">
              <p className="text-sm font-medium">Card details</p>
              <div className="flex justify-between items-center gap-4 sm:gap-10 max-sm:flex-col max-sm:items-start ">
                <div className="flex justify-start items-center gap-3">
                  <PiCreditCard className="text-2xl text-n100" />
                  <input
                    type="number"
                    className="w-full outline-none bg-transparent"
                    placeholder="Card number"
                  />
                </div>
                <div className="flex justify-end items-center gap-6  flex-1">
                  <input
                    type="month"
                    className="outline-none bg-transparent w-[140px]"
                    placeholder="MM/YYYY"
                  />
                  <input
                    type="number"
                    className="outline-none bg-transparent w-[50px]"
                    placeholder="CVC"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 pt-2">
            <PiLockKey className="text-xl text-primaryColor" />
            <p className="text-sm">Secured form Banking</p>
          </div>
          <div className="pt-6 sm:pt-10 flex flex-col justify-end items-end text-end">
            <p className="text-n700 text-2xl font-semibold pt-2 dark:text-n30">
              Billed Now: $99
            </p>
            <p className="text-sm text-primaryColor  font-medium">
              Apply Promo Code
            </p>
            <p className="text-sm py-5 w-full sm:w-[450px]">
              By clicking &quot;Start Premium plan&quot;, you agree to be
              charged $99 every month, unless you cancel.
            </p>
            <Link
              href={"/"}
              className="text-white bg-primaryColor rounded-full py-3 px-6 text-sm"
            >
              Start Premium Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
