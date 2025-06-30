"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface TermsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

const TermsDialog: React.FC<TermsDialogProps> = ({ isOpen, onOpenChange, onAgree }) => {
  const [agreed, setAgreed] = useState(false);

  const handleAgreeAndSubmit = () => {
    if (agreed) {
      onAgree();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setAgreed(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription asChild>
            <span>Please read and agree to the terms and conditions before submitting your post.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-60 overflow-y-auto text-sm">
          <p><strong>1. Content Ownership:</strong> You retain ownership of the content you post. By posting, you grant 希望夢想牆 a license to display and distribute your content.</p>
          <p><strong>2. Prohibited Content:</strong> Do not post content that is illegal, offensive, defamatory, or infringes on intellectual property rights.</p>
          <p><strong>3. Community Guidelines:</strong> Respect other users. No harassment or hate speech will be tolerated.</p>
          <p><strong>4. Data Usage:</strong> Your provided information (name, phone, email) will be used for account creation and communication related to 希望夢想牆. We respect your privacy.</p>
          <p><strong>5. Moderation:</strong> 希望夢想牆 reserves the right to moderate or remove content that violates these terms or community guidelines.</p>
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
          <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I have read and agree to the terms and conditions.
          </Label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleAgreeAndSubmit} disabled={!agreed}>
            Agree and Submit Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;