import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuoteItemWithCalculation } from "@/lib/types";

interface QuoteItemFormProps {
  item: QuoteItemWithCalculation;
  onChange: (item: QuoteItemWithCalculation) => void;
}

export function QuoteItemForm({ item, onChange }: QuoteItemFormProps) {
  // Calculate the total whenever unitPrice or quantity changes
  useEffect(() => {
    // Ensure we're working with numbers
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice as any) || 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity as any) || 0;
    
    const total = unitPrice * quantity;
    
    // Only update if total has changed to avoid infinite loops
    if (total !== item.total) {
      console.log(`Calculating item total: ${unitPrice} * ${quantity} = ${total}`);
      onChange({ ...item, unitPrice, quantity, total });
    }
  }, [item.unitPrice, item.quantity]);

  // Handle input changes with better error handling
  const handleChange = (field: keyof QuoteItemWithCalculation, value: string) => {
    try {
      let parsedValue: any = value;
      
      // Convert numeric fields to numbers
      if (field === 'unitPrice' || field === 'quantity' || field === 'sqft') {
        const numValue = parseFloat(value);
        parsedValue = isNaN(numValue) ? 0 : numValue;
      }
      
      console.log(`Updating item field '${field}' to:`, parsedValue);
      onChange({ ...item, [field]: parsedValue });
    } catch (error) {
      console.error(`Error updating field '${field}':`, error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Description - full width on all screen sizes */}
      <div className="w-full">
        <Label htmlFor={`description-${item.id}`}>Description</Label>
        <Input
          id={`description-${item.id}`}
          value={item.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Item description"
        />
      </div>
      
      {/* Two columns for small screens and up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`sqft-${item.id}`}>Sq.Ft (Optional)</Label>
          <Input
            id={`sqft-${item.id}`}
            type="number"
            value={item.sqft || ''}
            onChange={(e) => handleChange('sqft', e.target.value)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor={`unitPrice-${item.id}`}>Unit Price ($)</Label>
          <Input
            id={`unitPrice-${item.id}`}
            type="number"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => handleChange('unitPrice', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      
      {/* Two columns for small screens and up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
          <Input
            id={`quantity-${item.id}`}
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="1"
          />
        </div>
        
        <div>
          <Label>Total</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 flex items-center">
            ${(item.unitPrice * item.quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
