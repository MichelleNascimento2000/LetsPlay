import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';
import { FiltersService } from '../services/filters.service';
import { GameplaysService } from '../services/gameplays.service';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
})

export class HomePage {
	constructor(
		public router           : Router,
		public databaseService  : DatabaseService,
		public loadingController: LoadingController,
		public storage          : Storage,
        public filtersService   : FiltersService,
		public gameplaysService : GameplaysService
	){}

	async ngOnInit(){
        
        //  Evitar recursão de execução mais de uma vez do OnInit
		if(!this.databaseService.haveAppOpened){
			await this.createLoading('Aguarde...');
			this.presentLoading();

            //  Recuperar da API informações dos gêneros e plataformas
            await this.databaseService.getAllGenresFromAPI();
            await this.databaseService.getAllPlatformsFromAPI();
                
            try{
                await this.storage.get('gameplays').then(
                    gameplay => this.gameplaysService.allGameplays.push(...gameplay)
                );
            } catch (error){}
				
            await this.gameplaysService.populateAllGameplaysToShowMap();

            //  Atribuir o número máximo de registros de jogos a ser pesquisado por vez na API
            this.databaseService.pageSizeCountParam = 10;
            
            //  Recuperar jogos iniciais
			await this.databaseService.getGamesFromAPI(
				this.databaseService.getBuiltQueryURL()
            );
			await this.gameplaysService.getGameplaysInfoFromAPI();
            
			this.databaseService.haveAppOpened = true;

			this.dismissLoading();
		}

        //  Popular Map com as parametrizações dos filtros
        this.filtersService.populateFiltersOptionsMap();
	}

    //  Redirecionar para a página de busca de jogos
    public redirectToGameSearching(){
		this.router.navigate(['search']);
	}

    //  Redirecionar para página de jogatinas
	public redirectToMyGameplays(){
		this.gameplaysService.setComingFromSearch(false);
		this.router.navigate(['gameplays/playing-games']);
	}


    //  Métodos para elemento de loading
	public loading: HTMLIonLoadingElement;

    //  Criar o loading
	public async createLoading(messageToShow: string){
		this.loading = await this.loadingController.create({
			message : messageToShow,
			cssClass: 'loading-info-style'
		});
	}

    //  Fechar o loading
	public async dismissLoading(){
		this.loading.dismiss();
	}

    //  Mostrar o loading
	public async presentLoading(){
		await this.loading.present();
	}
}