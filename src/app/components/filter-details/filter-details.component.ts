import { Component, Input, OnInit } from '@angular/core';
import { FiltersService } from 'src/app/services/filters.service';

@Component({
    selector: 'app-filter-details',
    templateUrl: './filter-details.component.html',
    styleUrls: ['./filter-details.component.scss'],
})
export class FilterDetailsComponent implements OnInit {

    constructor(
        public filtersService: FiltersService
    ){}

    ngOnInit(){
        this.filtersService.startFiltersPage(this.filter_name);
    }

	@Input() filter_name;
}