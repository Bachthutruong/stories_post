"use client";

import { useState } from "react";
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
    url: string;
    title: string;
    description?: string;
    variant?: "default" | "ghost" | "outline" | "secondary" | "destructive";
    size?: "sm" | "default" | "lg";
    showText?: boolean;
    className?: string;
    onShare?: () => void;
}

export function ShareButton({
    url,
    title,
    description = "",
    variant = "outline",
    size = "default",
    showText = true,
    className = "",
    onShare
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const fullUrl = typeof window !== 'undefined'
        ? new URL(url, window.location.origin).toString()
        : url;

    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(title);
    // const encodedDescription = encodeURIComponent(description);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle} ${encodedUrl}`,
    };

    const handleShare = (platform: string) => {
        if (platform === 'copy') {
            navigator.clipboard.writeText(fullUrl).then(() => {
                setCopied(true);
                toast({
                    title: "已複製",
                    description: "鏈接已複製到剪貼板",
                });
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                toast({
                    variant: "destructive",
                    title: "錯誤",
                    description: "無法複製鏈接",
                });
            });
            if (onShare) {
                onShare();
            }
            return;
        }

        if (platform === 'native' && navigator.share) {
            navigator.share({
                title: title,
                text: description,
                url: fullUrl,
            }).catch((error) => {
                console.error('Error sharing:', error);
            });
            if (onShare) {
                onShare();
            }
            return;
        }

        const shareUrl = shareLinks[platform as keyof typeof shareLinks];
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            if (onShare) {
                onShare();
            }
        }
    };

    // Check if native sharing is available
    const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <Share2 className="h-4 w-4" />
                    {showText && <span className="ml-2">分享</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {/* {hasNativeShare && (
                    <DropdownMenuItem onClick={() => handleShare('native')}>
                        <Share2 className="mr-2 h-4 w-4" />
                        分享
                    </DropdownMenuItem>
                )} */}
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                    Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                    <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                    LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                    <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                    WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                    {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                        <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "已複製" : "複製鏈接"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 