"use client";
import React from "react";
import { PiFile, PiInfo, PiArrowLeft } from "react-icons/pi";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface TopicHeaderProps {
  title: string;
  materialsCount?: number;
  description?: string;
}

const TopicHeader: React.FC<TopicHeaderProps> = ({ 
  title, 
  materialsCount = 0, 
  description 
}) => {
  const router = useRouter();
  const [showInfo, setShowInfo] = React.useState(false);
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-[1070px] mx-auto mb-4">
      <div className="w-full bg-primaryColor/10 p-4 rounded-xl border border-primaryColor/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <PiArrowLeft className="text-primaryColor" />
            </button>
            <h1 className="font-medium text-xl truncate max-w-[200px] sm:max-w-[300px] md:max-w-[500px]">{title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <PiFile className="text-primaryColor" />
              <span>{materialsCount} {materialsCount === 1 ? t('assistance.material') : t('assistance.materials')}</span>
            </div>
            
            {description && (
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-2 rounded-full transition-colors duration-200 ${showInfo ? 'bg-primaryColor text-white' : 'hover:bg-white/20 text-primaryColor'}`}
              >
                <PiInfo />
              </button>
            )}
          </div>
        </div>
        
        {showInfo && description && (
          <div className="mt-3 p-3 bg-white/20 rounded-lg text-sm">
            <p>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicHeader; 