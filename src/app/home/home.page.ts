import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { DatabaseService } from '../services/database.service';


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
		public storage          : Storage
    ){}

    async ngOnInit(){
        
        //  Evitar recursão de execução mais de uma vez do OnInit
		if(!this.databaseService.haveAppOpened){ 
			await this.createLoading('Aguarde...');
			this.presentLoading();

            //  Recuperar da API informações dos gêneros e plataformas
            await this.databaseService.getAllGenresFromAPI();
            await this.databaseService.getAllPlatformsFromAPI();
            
            //  Atribuir o número máximo de registros de jogos a ser pesquisado por vez na API
            this.databaseService.pageSizeCountParam = 10;
            
            //  Recuperar jogos iniciais
			await this.databaseService.getGamesFromAPI(
				this.databaseService.getBuiltQueryURL()
            );
			this.databaseService.haveAppOpened = true;

			this.dismissLoading();
		}
	}

    //  Redirecionar para a página de busca de jogos
    public redirectToGameSearching(){
		this.router.navigate(['search']);
	}

    //  Redirecionar para página de jogatinas
	public redirectToMyGameplays(){
	}


    //  Métodos para elemento de loading
    public loading: HTMLIonLoadingElement;
    
	public async createLoading(messageToShow: string){
		this.loading = await this.loadingController.create({
			message : messageToShow,
			cssClass: 'loading-info-style'
		});
	}

	public async dismissLoading(){
		this.loading.dismiss();
	}

	public async presentLoading(){
		await this.loading.present();
	}
}