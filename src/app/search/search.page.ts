import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { GameplaysService } from '../services/gameplays.service';
import { FiltersService } from '../services/filters.service';
import { Filters } from '../models/API-Models';
import { KeyValue } from '@angular/common';
import { Router } from '@angular/router';

@Component({
	selector: 'app-search',
	templateUrl: './search.page.html',
	styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {

	constructor(
		public databaseService : DatabaseService,
		public gameplaysService: GameplaysService,
		public filtersService  : FiltersService,
		public router          : Router
	){}

	ngOnInit(){}
    
    //  Enum com os valores dos demais filtros a serem utilizados
	public filtersEnum = Filters;
    
    //  Método para passar como parâmetro no pipe do keyValue dos filtros
    //  Exibe os filtros na ordem inserida na classe Enum
	public originalOrder = (a: KeyValue<string, string>, b: KeyValue<string, string>): number => {
		return 0;
	}

    //  Atualizar variável do filtro atual e navegar para a página de listagem de filtros
    public changeCurrentFilter(filterName: string): void{
		this.filtersService.currentFilterName = filterName;
		this.router.navigate(['filter']);
	}
}