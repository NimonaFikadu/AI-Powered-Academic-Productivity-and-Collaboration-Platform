"use client";
import FaqItem from "@/components/ui/FaqItem";
import InputFieldSecond from "@/components/ui/InputFieldSecond";
import TextArea from "@/components/ui/TextArea";
import { faqData, supportMenuItems } from "@/constants/data";
import React, { useState } from "react";

function SupportModal() {
  const [activeMenu, setActiveMenu] = useState(0);
  const [show, setShow] = useState(2);
  const [show2, setShow2] = useState(NaN);
  return (
    <div className="">
      <div className="p-2 border border-primaryColor/30 bg-primaryColor/5 rounded-xl min-[1400px]:rounded-full flex flex-row justify-centert items-center flex-wrap gap-2 w-full mt-6">
        {supportMenuItems.map(({ id, name, icon }, idx) => (
          <div
            key={id}
            className={`flex justify-start items-center gap-2 xl:gap-2 py-2 pl-2 flex-1  border  rounded-full cursor-pointer ${
              activeMenu === idx
                ? " border-primaryColor bg-primaryColor"
                : "border-primaryColor/30 bg-white"
            }`}
            onClick={() => setActiveMenu(idx)}
          >
            <div
              className={`flex justify-center items-center border  rounded-full p-1.5 xl:p-2  ${
                activeMenu === idx
                  ? " border-primaryColor bg-white "
                  : "border-primaryColor/30 bg-primaryColor/5"
              }`}
            >
              {React.createElement(icon, {
                className: `text-primaryColor text-base xl:text-xl`,
              })}
            </div>
            <p
              className={`text-sm font-medium text-nowrap pr-4 ${
                activeMenu === idx ? "text-white" : ""
              }`}
            >
              {name}
            </p>
          </div>
        ))}
      </div>

      {activeMenu === 0 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className=" pb-5 border-b border-primaryColor/30">
            <p className="text-n700 font-medium dark:text-n30">
              Frequently Asked Questions
            </p>
            <p className="pt-2 text-xs">
              Find answers to common questions about our platform.
            </p>
          </div>
          <div className="pt-5 grid grid-cols-12 gap-4">
            <div className=" col-span-12 md:col-span-6 flex flex-col gap-4">
              {faqData.slice(0, 5).map(({ id, ...props }, idx) => (
                <FaqItem
                  key={id}
                  {...props}
                  idx={idx}
                  show={show}
                  setShow={setShow}
                />
              ))}
            </div>
            <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
              {faqData.slice(5, 10).map(({ id, ...props }, idx) => (
                <FaqItem
                  key={id}
                  {...props}
                  idx={idx}
                  show={show2}
                  setShow={setShow2}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeMenu === 1 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className="border-b border-primaryColor/20 w-full pb-5">
            <p className="font-medium text-n700 ">Change Log</p>
            <p className="text-xs pt-2">
              Track our latest updates and improvements.
            </p>
          </div>
          <div className="flex flex-col gap-5 pt-5">
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  GPT-4o
                </p>
                <p className="text-xs font-medium border border-secondaryColor/30 bg-secondaryColor/5 rounded-full py-1 px-3 text-secondaryColor">
                  New
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">
                  Updated documentation styling for consistency across all pages
                </li>
                <li>
                  Improved link accuracy and navigation throughout documentation
                </li>
                <li>Enhanced changelog accuracy and version tracking</li>
                <li>Standardized documentation layout and structure</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.0v Flash Thinking Experimental
                </p>
                <p className="text-xs font-medium border border-infoColor/30 bg-infoColor/5 rounded-full py-1 px-3 text-infoColor">
                  Dec 2024
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Basic chat interface implementation</li>
                <li>Support for text and image messages</li>
                <li>Responsive design for mobile and desktop</li>
                <li>Initial documentation structure</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  1.9.1 Thinking Experimental with apps
                </p>
                <p className="text-xs font-medium border border-warningColor/30 bg-warningColor/5 rounded-full py-1 px-3 text-yellow-700">
                  Jun 2024
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Reasoning across YouTube, Maps & Search</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  1.9v Flash
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Previous Model</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  1.5v Flash
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Start Journey With AI</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeMenu === 2 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className="border-b border-primaryColor/20 w-full pb-5">
            <p className="font-medium text-n700">
              Product Roadmap
            </p>
            <p className="text-xs pt-2">
              See what&apos;s coming next in our development pipeline.
            </p>
          </div>
          <div className="flex flex-col gap-5 pt-5">
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.1v Flash
                </p>
                <p className="text-xs font-medium border border-infoColor/30 bg-infoColor/5 rounded-full py-1 px-3 text-infoColor">
                  In Progress
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">
                  Multi-language support with real-time translation
                </li>
                <li>Advanced analytics dashboard with custom reporting</li>
                <li>Team collaboration features with role-based access</li>
                <li>Enhanced bot training capabilities</li>
                <li>Custom workflow templates</li>
                <li>Improved data visualization tools</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.2v Flash
                </p>
                <p className="text-xs font-medium border border-warningColor/30 bg-warningColor/5 rounded-full py-1 px-3 text-yellow-700">
                  Planned
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Native mobile applications (iOS & Android)</li>
                <li>API integration marketplace with popular services</li>
                <li>Custom workflow builder with drag-and-drop interface</li>
                <li>Advanced document processing capabilities</li>
                <li>Real-time voice chat with AI</li>
                <li>Enhanced data export options</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.3v Flash
                </p>
                <p className="text-xs font-medium border border-warningColor/30 bg-warningColor/5 rounded-full py-1 px-3 text-yellow-700">
                  Planned
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">
                  Enterprise SSO integration with major providers
                </li>
                <li className="">Advanced AI model customization options </li>
                <li className="">Automated workflow templates library </li>
                <li className="">
                  Enhanced security features and compliance tools
                </li>
                <li className="">Advanced team collaboration tools </li>
                <li className="">Custom bot marketplace </li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.4v Flash
                </p>
                <p className="text-xs font-medium border border-warningColor/30 bg-warningColor/5 rounded-full py-1 px-3 text-yellow-700">
                  Planned
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Native mobile applications (iOS & Android)</li>
                <li className="">
                  API integration marketplace with popular services{" "}
                </li>
                <li className="">
                  Custom workflow builder with drag-and-drop interface{" "}
                </li>
                <li className="">Advanced document processing capabilities </li>
                <li className="">Real-time voice chat with AI </li>
                <li className="">Enhanced data export options </li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  2.5v Flash
                </p>
                <p className="text-xs font-medium border border-secondaryColor/30 bg-secondaryColor/5 rounded-full py-1 px-3 text-secondaryColor">
                  Future
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">AI-powered predictive analytics</li>
                <li className="">
                  Advanced natural language processing capabilities
                </li>
                <li className="">Extended reality (XR) integration</li>
                <li className="">Blockchain-based data verification</li>
                <li className="">Advanced automation features</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeMenu === 3 && (
        <div className="mt-6  border border-primaryColor/30 rounded-xl p-5">
          <div className="border-b border-primaryColor/20 w-full pb-5">
            <p className="font-medium text-n700">
              Contact Support
            </p>
            <p className="text-xs pt-2">
              Get in touch with our support team for assistance.
            </p>
          </div>
          <form className="grid grid-cols-12 gap-5 pt-5">
            <InputFieldSecond
              className="col-span-6"
              placeholder="Theresa"
              title="First Name"
            />

            <InputFieldSecond
              className="col-span-6"
              placeholder="Webb"
              title="Last Name"
            />
            <InputFieldSecond
              className="col-span-6"
              placeholder="demo@mail.com"
              title="Email"
              type="email"
            />
            <InputFieldSecond
              className="col-span-6"
              placeholder="(270) 555-5555"
              title="Mobile"
              type="tel"
            />
            <TextArea
              className="col-span-12"
              placeholder="Enter your message here"
              title="Message"
            />
            <button className="text-sm font-medium text-white bg-primaryColor text-center py-3 px-6 rounded-full w-full col-span-12">
              Send Message
            </button>
          </form>
        </div>
      )}
      {activeMenu === 4 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className="border-b border-primaryColor/20 w-full pb-5">
            <p className="font-medium text-n700">
              Privacy Policy
            </p>
            <p className="text-xs pt-2">
              Learn about how we handle and protect your data.
            </p>
          </div>
          <div className="flex flex-col gap-5 pt-5">
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Data Collection
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We collect information that you provide directly to us,
                including when you create an account, use our services, or
                communicate with us.
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Name and contact information</li>
                <li>Account credentials</li>
                <li>Chat history and preferences</li>
                <li>Usage data and analytics</li>
                <li>Payment information when purchasing premium features</li>
                <li>Device information and IP addresses</li>
                <li>Custom bot configurations and settings</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Data Usage
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We use the collected information to:
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Provide and maintain our services</li>
                <li>Improve user experience</li>
                <li>Send important notifications</li>
                <li>Protect against misuse</li>
                <li>Personalize your experience and content</li>
                <li>Process transactions and payments</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Debug and optimize performance</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Data Protection
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction.{" "}
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">End-to-end encryption for sensitive data</li>
                <li className="">Regular security audits and assessments</li>
                <li className="">Secure data storage and transmission</li>
                <li className="">Access controls and authentication</li>
                <li className="">Employee training on data protection</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Your Rights
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                You have certain rights regarding your personal data:
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Right to access your personal data</li>
                <li className="">Right to correct inaccurate data</li>
                <li className="">Right to request data deletion</li>
                <li className="">Right to restrict processing</li>
                <li className="">Right to data portability</li>
                <li className="">Right to object to processing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeMenu === 5 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className="border-b border-primaryColor/20 w-full pb-5">
            <p className="font-medium text-n700">
              Terms of Service
            </p>
            <p className="text-xs pt-2">
              Please read these terms carefully before using our services.
            </p>
          </div>
          <div className="flex flex-col gap-5 pt-5">
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Acceptance of Terms
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                By accessing or using our services, you agree to be bound by
                these terms and all applicable laws and regulations. If you do
                not agree with any of these terms, you are prohibited from using
                or accessing our services.
              </p>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Use License
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We grant you a limited, non-exclusive, non-transferable license
                to use our services for personal or business purposes in
                accordance with these terms. This license is subject to the
                following restrictions:
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">You may not modify or copy our software</li>
                <li>You may not use the service for illegal purposes</li>
                <li>You may not transmit harmful code or malware</li>
                <li>You may not attempt to gain unauthorized access</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  User Responsibilities
                </p>
              </div>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">Maintain the security of your account</li>
                <li className="">
                  Comply with all applicable laws and regulations
                </li>
                <li className="">Respect intellectual property rights</li>
                <li className="">Use the service responsibly</li>
                <li className="">Provide accurate account information</li>
                <li className="">Report any security vulnerabilities</li>
                <li className="">Not share account credentials</li>
                <li className="">Not use the service to harm others</li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Service Modifications
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We reserve the right to modify, suspend, or discontinue our
                services at any time without notice. We shall not be liable for
                any modification, suspension, or discontinuation of the
                services.
              </p>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Intellectual Property
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                All content, features, and functionality of our service are
                owned by us and protected by international copyright, trademark,
                and other intellectual property laws.
              </p>
              <ul className="text-xs text-n300 list-disc list-inside pt-1 flex flex-col gap-0.5">
                <li className="">
                  Our trademarks may not be used without permission
                </li>
                <li className="">
                  User-generated content remains your property
                </li>
                <li className="">
                  You grant us license to use your content for service operation
                </li>
                <li className="">
                  We respect intellectual property rights of others
                </li>
              </ul>
            </div>
            <div className="">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-n700">
                  Limitation of Liability
                </p>
              </div>
              <p className="text-xs text-n300 pt-1">
                We shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages resulting from your use of
                our service.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportModal;
