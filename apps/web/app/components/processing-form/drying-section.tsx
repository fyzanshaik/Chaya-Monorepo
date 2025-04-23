'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { PlusCircle, Trash } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

export function DryingSection() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'drying',
  });

  const addDay = () => {
    const dayNumber = fields.length + 1;
    append({
      day: dayNumber,
      temperature: 0,
      humidity: 0,
      pH: 0,
      moistureQuantity: 0,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Drying Details</h3>
            <Button type="button" variant="outline" size="sm" onClick={addDay} className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Day
            </Button>
          </div>

          {fields.length === 0 && <div className="text-center text-gray-500 py-4">No drying details added yet</div>}

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded p-4 space-y-4 relative">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Day {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`drying.${index}.temperature`}>Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id={`drying.${index}.temperature`}
                    {...control.register(`drying.${index}.temperature`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor={`drying.${index}.humidity`}>Humidity (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id={`drying.${index}.humidity`}
                    {...control.register(`drying.${index}.humidity`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor={`drying.${index}.pH`}>pH</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id={`drying.${index}.pH`}
                    {...control.register(`drying.${index}.pH`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor={`drying.${index}.moistureQuantity`}>Moisture Quantity (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id={`drying.${index}.moistureQuantity`}
                    {...control.register(`drying.${index}.moistureQuantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
