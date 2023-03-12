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
    

    //  Notas buildadas após input do usuário para comparar e validar e;
    //  Últimas notas entradas pelo usuário, para apresentar na tela após posteriores acessos ao filtro
    public ratingsInputMap = new Map([
        ['Minimum', {'rat': 49}],
        ['Maximum', {'rat': 100}],
        
        ['LastMinimum', {'rat': 49}],
        ['LastMaximum', {'rat': 100}]
    ]);

    //  Datas buildadas após input do usuário para comparar e validar e;
    //  Últimas datas entradas pelo usuário, para apresentar na tela após posteriores acessos ao filtro
    public builtDatesMap = new Map([
        ['Minimum', new Date()],
        ['Maximum', new Date()],
        
        ['LastMinimum', new Date()],
        ['LastMaximum', new Date()]
    ]);

    //  Atributos a serem usados para o input de data pelo usuário
    public datesInputMap = new Map([
        ['Minimum', {'day': 1, 'month': 1, 'year': 2020}],
        ['Maximum', {'day': 1, 'month': 1, 'year': 2020}],
    ]);

    //  Variáveis constantes para guardar a parametrização de dias -> mês  
    public MAX_DAYS_IN_MONTH = {
        1: 31,
        2: 28,
        3: 31,
        4: 30,
        5: 31,
        6: 30,
        7: 31,
        8: 31,
        9: 30,
        10: 31,
        11: 30,
        12: 31,
    };
    
    public MAX_DAYS_IN_MONTH_LEAP_YEAR = {
        ...this.MAX_DAYS_IN_MONTH,
        2: 29,
    };

    //  Variáveis para verificar e acusar erros quanto ao input dos filtros não textuais
    public validationNoTextInputMap = new Map([
        ['Nota',               {'valid': true, 'message': ''}],
        ['Data de lançamento', {'valid': true, 'message': ''}]
    ]);

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

            case Filters.Empresas:
                const selectedCompanyOptions: FilterOption[] = currentOptions.filter(option => option.selected);                
                if(selectedCompanyOptions.length == 0){

                    //  Buscar dinamicamente devido a volume
                    await this.databaseService.getCompaniesFromAPIForFilter(null);

    				this.buildFilterOptions(currentOptions, this.databaseService.searchedCompanies);
                    this.setOptionsToShow(currentOptions);
                } else {

                    //  Exibir apenas opções selecionadas caso existam
                    this.setOptionsToShow(selectedCompanyOptions);
                }
				break;

			case Filters.Nota:

                //  Setar no campo de nota os valores pré setados, ou os valores padrões caso não haja entrada ainda 
                this.ratingsInputMap.set('Minimum', this.ratingsInputMap.get('LastMinimum'));
                this.ratingsInputMap.set('Maximum', this.ratingsInputMap.get('LastMaximum'));
				break;

			case Filters.DataLancamento:

                //  Setar no campo de data os valores pré setados, ou os valores padrões caso não haja entrada ainda
                const lastMinimumDate = this.builtDatesMap.get('LastMinimum');
                const lastMaximumDate = this.builtDatesMap.get('LastMaximum');

                this.datesInputMap.set('Minimum', {
                    'day':      lastMinimumDate.getDate(),
                    'month':    lastMinimumDate.getMonth() + 1,
                    'year':     lastMinimumDate.getFullYear()
                });

                this.datesInputMap.set('Maximum', {
                    'day':      lastMaximumDate.getDate(),
                    'month':    lastMaximumDate.getMonth() + 1,
                    'year':     lastMaximumDate.getFullYear()
                });

                //  Buildar dado de data
				this.buildDates();
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
        
        //  Para o filtro de Empresas, buscar pelas opções carregadas em tempo de execução
        //  Para as demais, buscar por todas as opções presentes
        if(filterName == Filters.Empresas){
            allIdsArray.push(...this.optionsToShow.filter(option => option.preSelected).map(option => option.value));
        } else {
            allIdsArray.push(...this.allCurrentOptions.filter(option => option.preSelected).map(option => option.value));
        }
        allIdsQuery = allIdsArray.join(',');
        
		if(!this.isResettingFilters){
            const currentFilterParams: FilterOptionsParams = this.getCurrentFilterOptionsParams(filterName);
            const currentParam       : string              = currentFilterParams.concatParam;

            switch (filterName) {
                case Filters.Generos:
                case Filters.Plataformas:
                case Filters.Empresas:                    

                    //  Concatenar com termo de filtro da categoria específica, e com os IDs
                    currentFilterParams.query = allIdsQuery != '' ? (currentParam + allIdsQuery) : '';
                    break;

                case Filters.Nota:

                    //  Recuperar notas entradas pelo usuário
                    const minimumRating = this.ratingsInputMap.get('Minimum').rat;
                    const maximumRating = this.ratingsInputMap.get('Maximum').rat;

                    currentFilterParams.query = `${currentParam}${minimumRating},${maximumRating}`;
                    
                    //  Setar variáveis com últimas notas entradas
                    this.ratingsInputMap.set('LastMinimum', {'rat': minimumRating});
                    this.ratingsInputMap.set('LastMaximum', {'rat': maximumRating});

                    currentFilterParams.useFilter = true;
                    break;

                case Filters.DataLancamento:

                    //  Recuperar datas entradas pelo usuário
                    const minDateMap = this.datesInputMap.get('Minimum');
                    const maxDateMap = this.datesInputMap.get('Maximum');

                    const fromDate = `${minDateMap.year}-${minDateMap.month.toString().padStart(2, '0')}-${minDateMap.day.toString().padStart(2, '0')}`;
                    const toDate   = `${maxDateMap.year}-${maxDateMap.month.toString().padStart(2, '0')}-${maxDateMap.day.toString().padStart(2, '0')}`;
                    currentFilterParams.query = `${currentParam}${fromDate},${toDate}`;

                    //  Setar variáveis com últimas datas entradas
                    this.builtDatesMap.set('LastMinimum', this.builtDatesMap.get('Minimum'));
                    this.builtDatesMap.set('LastMaximum', this.builtDatesMap.get('Maximum'));

                    currentFilterParams.useFilter = true;
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

        if (filterName !== Filters.Empresas) {

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

        } else {

            //  A busca por empresas deve ser dinâmica devido ao volume
            await this.databaseService.getCompaniesFromAPIForFilter(this.searchValue);
            
            for(const company of this.databaseService.searchedCompanies){
                const opt: FilterOption = {
                    preSelected: false,
                    selected   : false,
                    name       : company.name,
                    value      : company.id
                };
                
                //  Empresas buscadas e registradas desde a abertura do app
                const options = this.filterOptionsParamsMap.get(Filters.Empresas).options;

                //  Para cada empresa da API encontrada, se a lista de todas não possuir, deve adicionar
                if(!options.find(option => option.name.includes(company.name))){
                    options.push(opt);
                }

                //  Adicionar apenas opções que não estejam dentre as já selecionadas, pois estas estão fixadas no topo da exibição
                if(!options.find(option => option.name.includes(company.name)).selected){
                    this.optionsToShow.push(opt);
                }
            }
        }

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
			'Plataformas',
			'Empresas'
		].includes(filterName);
	}

    //  Controle para setar layout de filtro númérico na tela
	public isFilterNumberRange(filterName: string){
		return filterName == 'Nota';
	}

    //  Controle para setar layout de filtro de data na tela
	public isFilterDate(filterName: string){
		return filterName == 'Data de lançamento';
	}

    //  Validar input de nota
	public validateRatingInput(){
        const minimumRating = this.ratingsInputMap.get('Minimum').rat;
        const maximumRating = this.ratingsInputMap.get('Maximum').rat;
        
        //  Não pode estar vazio
		if(!minimumRating || !maximumRating){
			this.throwNoTextFilterError('Nota', 'Digite um valor para continuar!');
            return;
		}
        
        //  Não pode exceder o limite de valores presentes na API, que é entre 49 e 100
        if(maximumRating > 100 || maximumRating < 49 || minimumRating > 100 || minimumRating < 49){
			this.throwNoTextFilterError('Nota', 'Digite um valor entre 49 e 100!');
            return;
		}

        //  Não pode ter o valor máximo como menor que o mínimo
        if(maximumRating < minimumRating){
			this.throwNoTextFilterError('Nota', 'O valor mínimo deve ser menor do que o máximo!');
            return;
		}

        this.removeNoTextFilterError('Nota');
	}

    //  Buildar as datas usando o input do usuário, e setando nas variáveis correspondentes
	public buildDates(){
        const minimumDate = this.datesInputMap.get('Minimum');
        const maximumDate = this.datesInputMap.get('Maximum');

		this.builtDatesMap.set('Minimum', new Date(
            minimumDate.year + '-' +
            minimumDate.month + '-' +
            minimumDate.day
        ));

		this.builtDatesMap.set('Maximum', new Date(
            maximumDate.year + '-' +
            maximumDate.month + '-' +
            maximumDate.day
        ));
	}

    //  Validar se as datas entradas pelo usuário são válidas
    public isDateValidInGeneral(){
        const minimumDateMap = this.datesInputMap.get('Minimum');
        const maximumDateMap = this.datesInputMap.get('Maximum');

        const maxDaysInMonthMin =   this.isLeapYear(minimumDateMap.year)
                                    ? this.MAX_DAYS_IN_MONTH_LEAP_YEAR
                                    : this.MAX_DAYS_IN_MONTH;

        const maxDaysInMonthMax =   this.isLeapYear(maximumDateMap.year)
                                    ? this.MAX_DAYS_IN_MONTH_LEAP_YEAR
                                    : this.MAX_DAYS_IN_MONTH;

        //  Verifica se o dia é válido de acordo consierando o mês e os anos bissextos
        const isValidDayMin = (day: number)   => day >= 1 && day <= maxDaysInMonthMin[minimumDateMap.month];
        const isValidDayMax = (day: number)   => day >= 1 && day <= maxDaysInMonthMax[maximumDateMap.month];
        
        //  Verifica se o mês é válido dentro do seu intervalo de 1 a 12
        const isValidMonth  = (month: number) => month >= 1 && month <= 12;

        //  Verifica se o ano é válido dentro do intervalo mínimo dos jogos presentes na API (maior ou igual que 1954)
        const isValidYear   = (year: number)  => year >= 1954;

        //  Verifica se dia/mês/ano são válidos para ambos os inputs
        const isMinimumValid =  isValidDayMin  (minimumDateMap.day) &&
                                isValidMonth(minimumDateMap.month) &&
                                isValidYear (minimumDateMap.year);
  
        const isMaximumValid =  isValidDayMax(maximumDateMap.day) &&
                                isValidMonth(maximumDateMap.month) &&
                                isValidYear (maximumDateMap.year);

        if(!isMinimumValid || !isMaximumValid){
            this.throwNoTextFilterError('Data de lançamento', 'Data inválida!');
            return false;
        }
        
        //  Caso as parametrizações individuais das datas sejam realmente válidas, buildar e adicionar ao map correspondente
        this.buildDates();
        
        //  Validar se a data mínima é menor do que a máxima
        if((this.builtDatesMap.get('Minimum').getTime() > this.builtDatesMap.get('Maximum').getTime())){
			this.throwNoTextFilterError('Data de lançamento', 'A data mínima deve ser menor do que a máxima!');
			return false;
		}

        this.removeNoTextFilterError('Data de lançamento');
        return true;
    }

    //  Auxiliar para retornar se o ano é bissexto
    public isLeapYear(year: number){
        return year % 400 == 0 ||
        (
            year % 4   == 0 &&
            year % 100 != 0
        );
    }

    //  Exibe na tela o erro relacionado ao filtro especificado
	public throwNoTextFilterError(type: string, message: string){
        this.validationNoTextInputMap.get(type).valid = false;
        this.validationNoTextInputMap.get(type).message = message;
	}

    //  Retira da tela o erro relacionado ao filtro especificado
	public removeNoTextFilterError(type: string){
		this.validationNoTextInputMap.get(type).valid = true;
	}
}