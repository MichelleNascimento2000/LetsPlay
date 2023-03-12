import { Component, OnInit } from '@angular/core';
import { FiltersService } from '../services/filters.service';

@Component({
	selector: 'app-filter',
	templateUrl: './filter.page.html',
	styleUrls: ['./filter.page.scss'],
})
export class FilterPage implements OnInit {

	constructor(
		public filtersService: FiltersService
	){}

	ngOnInit(){}
}