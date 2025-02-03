import { upgradeModalData } from "@/constants/data";
import useModalOpen from "@/hooks/useModalOpen";
import Link from "next/link";
import React from "react";
import { PiCaretDown, PiRocket } from "react-icons/pi";

function UpgradeModal() {
  const { modal, setModal, modalRef } = useModalOpen();
  return (
    <div
      className="flex justify-start items-center gap-2 relative"
      ref={modalRef}
    >
      <PiRocket className="text-[28px] text-primaryColor" />
      <div
        className=" cursor-pointer"
        onClick={() => setModal((prev) => !prev)}
      >
        <div className="flex justify-start items-center gap-1">
          <p className="font-medium text-sm">Upgrade</p>

          <PiCaretDown />
        </div>
        <p className="text-xs text-n300">GPT-4o</p>
      </div>

      <div
        className={`bg-white w-[280px] min-[450px]:w-[370px] absolute -left-8 min-[400px]:left-0 top-12 rounded-xl ${
          modal
            ? "visible opacity-100 translate-y-0"
            : " invisible opacity-0 translate-y-2"
        } duration-300 origin-top-left `}
      >
        <div
          className={`bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-4 flex flex-col gap-4 `}
        >
          {upgradeModalData.map(({ id, title, desc, isNew }) => (
            <div key={id} className="flex justify-between items-center gap-2">
              <div className="">
                <p className="font-medium text-sm ">{title}</p>
                <p className="text-xs text-n300 pt-1">{desc}</p>
              </div>
              {isNew && (
                <p className="text-secondaryColor text-[10px] rounded-full py-1 px-3 bg-secondaryColor/5 border border-secondaryColor/30 font-medium">
                  New
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">Advanced UniHub</p>
            <Link
              href={"/upgrade"}
              className="bg-primaryColor rounded-full text-white py-2 px-4 text-xs"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
