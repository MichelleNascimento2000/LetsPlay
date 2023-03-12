import { Injectable } from '@angular/core';
import { FilterOption, FilterOptionsParams, Filters } from '../models/API-Models';
import { DatabaseService } from './database.service';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class FiltersService {

	constructor(
		public databaseService: DatabaseService,
        public router         : Router
	){}

    //  Variável para guardar a categoria de filtro que está sendo atualmente configurada
	public currentFilterName: string;

    //  Todas as opções de filtro da categoria selecionada
    public allCurrentOptions: FilterOption[] = [];

    //  Opções de filtro que estão sendo exibidas na página
	public optionsToShow: FilterOption[] = [];
    
    //  Variável para recebre input do usuário para busca de filtros pelo nome
	public searchValue: string;

    //  Controle para indicar se foi encontrado algum jogo após a busca
	public hasFoundValue: boolean = true;

    //  Controle para indicar se algum dos filtros está sendo resetado, e bloquear a formação da query do filtro recém eliminado
	public isResettingFilters: boolean = false;


    //  Map dos parâmetros a serem usados nos processos de tratamento dos filtros
    public filterOptionsParamsMap = new Map<Filters, FilterOptionsParams>();

    //  Retornar parâmetros específicos de um filtro
    public getCurrentFilterOptionsParams(filterName: string){
        return this.filterOptionsParamsMap.get(filterName as Filters);
    }


    //  Iniciar página de filtros
	public async startFiltersPage(filterName: string){
        this.allCurrentOptions = [];
		this.optionsToShow = [];
        
        const currentFilterParams: FilterOptionsParams = this.getCurrentFilterOptionsParams(filterName)
        const currentOptions     : FilterOption[]      = currentFilterParams.options;
        const currentAPIValues   : any[]               = currentFilterParams.apiValues;
        
		switch (filterName){

			case Filters.Generos:
            case Filters.Plataformas:

                //  Criar filtros com opções já recuperadas da API
        		this.allCurrentOptions = this.buildFilterOptions(currentOptions, currentAPIValues);
			    this.setOptionsToShow(currentOptions);
                break;
		}
	}

    //  Criar opções buildadas de filtro
    public buildFilterOptions(listToAdd: FilterOption[], allData: any[]){
        if(listToAdd.length == 0){
            listToAdd.push(...allData.map(option => ({
                preSelected: false,
                selected   : false,
                name       : option.name,
                value      : option.id
            })));
        }
        return listToAdd;
    }
    
    //  Atualiza array com opções a serem exibidas
	public setOptionsToShow(optionList: FilterOption[]): void{

        //  Adicionar opções selecionadas primeiro para ficarem no topo, e dar melhor visualização
		this.optionsToShow = [
            ...optionList.filter(option => option.selected),
            ...optionList.filter(option => !option.selected)
        ];
	}

    //  Setar campo de "pré-selecionado" com o valor do "selecionado"
    //  Indicar se o filtro foi usado na busca recém realizada
    public setPreselected(){
        this.optionsToShow    .forEach(option => option.preSelected = option.selected);
        this.allCurrentOptions.forEach(option => option.preSelected = option.selected);
    }

    //  Setar campo de "selecionado" com o valor do "pré-selecionado"
    //  Ajustar visualização ao retornar para a página do filtro, para exibir apenas os aplicados e não os selecionados sem aplicação
    public resetSelectionsOnReturnToSearch(){
        this.optionsToShow    .forEach(option => option.selected = option.preSelected);
        this.allCurrentOptions.forEach(option => option.selected = option.preSelected);

        this.hasFoundValue = true;
        this.searchValue = '';
    }

    //  Aplicar fitros e buscar jogos correspondentes
	public async searchGames(filterName: string){
		this.databaseService.resetShownGameplays();
        this.databaseService.resetHasReachedMaxPages();
        this.databaseService.resetDataIDParam();
        this.databaseService.pageIndexParam = 1;

        //  Texto com todos os IDs dos elementos do filtro para busca na API
		let allIdsQuery = '';
		const allIdsArray = [];

        this.setPreselected();
        
        allIdsArray.push(...this.allCurrentOptions.filter(option => option.preSelected).map(option => option.value));
        allIdsQuery = allIdsArray.join(',');
        
		if(!this.isResettingFilters){
            const currentFilterParams: FilterOptionsParams = this.getCurrentFilterOptionsParams(filterName);
            const currentParam       : string              = currentFilterParams.concatParam;

            switch (filterName) {
                case Filters.Generos:
                case Filters.Plataformas:

                    //  Concatenar com termo de filtro da categoria específica, e com os IDs
                    currentFilterParams.query = allIdsQuery != '' ? (currentParam + allIdsQuery) : '';
                    break;
            }
		}

		this.writeCurrentWhere();
        
        //  Buscar pelos jogos
		this.databaseService.getGamesFromAPI(this.databaseService.getBuiltQueryURL());

		this.router.navigate(['search']);
		
		this.searchValue = '';
	}

    //  Montar parâmetro WHERE da API, usado para aplicar os filtros
    public writeCurrentWhere(): void {
        this.databaseService.currentWhere = '';
        this.filterOptionsParamsMap.forEach(param => this.databaseService.currentWhere += param.query);
    }

    //  Retorna se um filtro está sendo utilizado
	public isChosenFilterBeingUsed(filterName: string): boolean{
        const currentFilterParams: FilterOptionsParams = this.filterOptionsParamsMap.get(filterName as Filters);
		
        //  Se tiver lista com opções, é Gêneros, Plataformas ou Empresas
        //  Olhar se há opções selecionadas
        if(currentFilterParams.options){
            return currentFilterParams.options.filter(option => option.selected).length != 0;
        }
        
        //  Se não houver lista com opções, é Nota ou Data
        //  Olhar se a string da query está com valor
        return Boolean(currentFilterParams.query);
	}

    //  Resetar filtro individual
	public resetFilter(filterName: string, isAll: boolean){
		this.isResettingFilters = true;
        const currentFilterParams: FilterOptionsParams = this.getCurrentFilterOptionsParams(filterName);
        
        //  Resetar query, opções e flag de controle de uso
        //  Ou o filtro possui a lista com opções, ou possui a flag de controle
        currentFilterParams.query = '';
        if(currentFilterParams.options){
            this.unselectOptions(currentFilterParams.options);
        } else {
            currentFilterParams.useFilter = false;
        }

        //  Ao resetar filtro individual, fazer nova busca pelos jogos usando o filtro resetado
        if(!isAll){
            this.searchGames(filterName);
        }

		this.isResettingFilters = false;
	}

    //  Resetar todos os filtros
	public resetAllFilters(){
		this.databaseService.inputName = '';

        //  Itera sobre todos os tipos de filtro, e reseta cada um individualmente
        Object.values(Filters).forEach(filter => this.resetFilter(filter, true));

        //  Ao resetar todos os filtros, fazer nova busca pelos jogos usando o filtro resetado
		this.searchGames(Filters.Generos);
	}

    //  Desmarcar opções passadas como parâmetros
	public unselectOptions(options: FilterOption[]){
        options.forEach(opt => opt.selected = false);
	}

    //  Buscar opção de filtro por nome
	public async search(filterName: string){
        if(!Boolean(this.searchValue)){
            
            //  Reseta exibição da página caso o usuário não busque por nada
            this.startFiltersPage(filterName);
            return;
        }

        //  Limpar opções sendo mostradas atualmente
        this.resetOptionsToShow(filterName);

        const searchTerm = this.searchValue.toUpperCase();
        
        //  Busca por opções que contenham o input digitado pelo usuário
        //  Filtra todas as opções atualmente carregadas e que ainda não foram selecionadas
        const matchingOptions = this.allCurrentOptions.filter(option => (
            !option.selected &&
            option.name.toUpperCase().includes(searchTerm)
        ));

        // Busca uma correspondência exata entre as opções não selecionadas
        const exactMatch = matchingOptions.find(option => option.name.toUpperCase() === searchTerm);

        // Adiciona a correspondência exata, se existir, no topo da lista de opções a serem exibidas
        if (Boolean(exactMatch)) {
            this.optionsToShow.push(exactMatch);

            // Remove o item da lista com os demais
            matchingOptions.splice(matchingOptions.indexOf(exactMatch), 1);
        }

        // Ordena as opções por nome
        matchingOptions.sort((a, b) => a.name.localeCompare(b.name));

        // Adiciona as primeiras 9 opções restantes à lista de opções a serem exibidas
        this.optionsToShow.push(...matchingOptions.slice(0, 9));

        this.hasFoundValue = !!this.optionsToShow.length;
	}

    //  Resetar opções sendo exibidas
	public resetOptionsToShow(filterName: string): void{
		this.optionsToShow = [];
        this.setOptionsToShow(this.filterOptionsParamsMap.get(filterName as Filters).options.filter(option => option.selected));
	}

    //  Controle para setar layout de filtros de opções de texto na tela
	public isFilterWordList(filterName: string){
		return [
			'Gêneros',
			'Plataformas'
		].includes(filterName);
	}
}