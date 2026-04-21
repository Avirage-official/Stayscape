'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddUnknownPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
}

export default function AddUnknownPlaceDialog({
  open,
  onOpenChange,
  place,
}: AddUnknownPlaceDialogProps) {
  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{place.name}</DialogTitle>
          <DialogDescription>{place.address}</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
