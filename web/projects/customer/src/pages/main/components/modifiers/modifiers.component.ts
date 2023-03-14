import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Modifier } from '../../models/dish';

interface ModifierModified extends Modifier {
    selected?: string[];
    invalid?: boolean;
}

@Component({
    selector: 'app-modifiers',
    templateUrl: './modifiers.component.html',
    styleUrls: ['./modifiers.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class ModifiersComponent {



    @Input() modifiers: ModifierModified[];

    getModifiers() {

        const result: { _id: string; selected: string[]; }[] = [];

        let passed = true;

        for(const modifier of this.modifiers) {
            if(!modifier.selected || modifier.selected.length == 0) {
                if(modifier.required) {
                    passed = false;
                    modifier.invalid = true;
                }
                continue;
            }

            if(modifier.toSelectAmount == "one") {
                if(modifier.selected.length != 1) {
                    passed = false;
                    modifier.invalid = true;
                    continue;
                }
            } else if(modifier.toSelectAmount == "more") {
                if(modifier.selected!.length < modifier.toSelect) {
                    passed = false;
                    modifier.invalid = true;
                    continue;
                }
            } else if(modifier.toSelectAmount == "less") {
                if(modifier.selected.length > modifier.toSelect) {
                    passed = false;
                    modifier.invalid = true;
                    continue;
                }
            }

            modifier.invalid = false;
            result.push({ _id: modifier._id, selected: modifier.selected });
        }

        if(!passed) {
            return;
        }

        return result;
    }

    onOptionSelected(event: Event, modifierIndex: number, optionIndex: number) {
        const modifier = this.modifiers[modifierIndex];
        const option = modifier.options[optionIndex];

        const input = event.target as HTMLInputElement;

        modifier.selected = modifier.selected || [];

        if(!input.checked) {
            modifier.selected.splice(modifier.selected.indexOf(option._id), 1);
            return;
        }


        if(modifier.toSelectAmount == "one") {

            modifier.selected = [option._id];

        } else if(modifier.toSelectAmount == "more") {

            modifier.selected.push(option._id);

        } else if(modifier.toSelectAmount == "less") {
            if(modifier.selected.length == modifier.toSelect) {
                input.checked = false;
                return;
            }
            
            modifier.selected.push(option._id);
        }

    }

}
