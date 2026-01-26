import { useState } from "react";
import { getBankLogoInfo } from "@/lib/bankLogos";

interface BankLogoProps {
  connectorName: string | null;
  connectorImageUrl?: string | null;
  connectorPrimaryColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { container: "w-8 h-8", logo: "w-5 h-5", text: "text-sm" },
  md: { container: "w-12 h-12", logo: "w-8 h-8", text: "text-lg" },
  lg: { container: "w-16 h-16", logo: "w-10 h-10", text: "text-xl" },
};

export function BankLogo({
  connectorName,
  connectorImageUrl,
  connectorPrimaryColor,
  size = "md",
  className = "",
}: BankLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  
  const bankInfo = getBankLogoInfo(connectorName || "");
  const sizes = sizeClasses[size];
  
  // Use bank logo from CDN if available, otherwise fall back to Pluggy's image
  const primaryLogoUrl = bankInfo.logoUrl;
  const fallbackLogoUrl = bankInfo.fallbackUrl || connectorImageUrl;
  
  // Determine background color
  const bgColor = bankInfo.brandColor || 
    (connectorPrimaryColor 
      ? (connectorPrimaryColor.startsWith('#') 
          ? connectorPrimaryColor 
          : `#${connectorPrimaryColor}`)
      : 'hsl(var(--muted))');
  
  // Get first letter for fallback
  const fallbackLetter = (connectorName || 'B').charAt(0).toUpperCase();
  
  const handlePrimaryError = () => {
    setImgError(true);
  };
  
  const handleFallbackError = () => {
    setFallbackError(true);
  };
  
  return (
    <div 
      className={`${sizes.container} rounded-xl flex items-center justify-center overflow-hidden shadow-lg relative ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {!imgError && primaryLogoUrl ? (
        <img 
          src={primaryLogoUrl} 
          alt={connectorName || 'Instituição'}
          className={`${sizes.logo} object-contain`}
          onError={handlePrimaryError}
        />
      ) : !fallbackError && fallbackLogoUrl ? (
        <img 
          src={fallbackLogoUrl} 
          alt={connectorName || 'Instituição'}
          className={`${sizes.logo} object-contain`}
          onError={handleFallbackError}
        />
      ) : (
        <span className={`text-white font-bold ${sizes.text}`}>
          {fallbackLetter}
        </span>
      )}
    </div>
  );
}
