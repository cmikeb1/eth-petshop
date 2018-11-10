App = {
  web3Provider: null,
  contracts: {},
  lastRenderedForAccount: null,

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-force-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    
    // Modern dapp browsers...
    if(window.ethereum){
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (err) {
        // User denied account access        
        console.error("User denied account access.");
      }
    }
    else if(window.web3) { // Legacy dapp browsers...
      App.web3Provider = window.web3.currentProvider;
    }
    else { // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data){
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-force-adopt', App.handleAdopt);
    App.web3Provider.publicConfigStore.on('update', App.handleAccountChange);
  },

  handleAccountChange: function(data) {
    if(data.selectedAddress !== App.lastRenderedForAccount){
      App.markAdopted();
    }
  },

  markAdopted: function() {
    web3.eth.getAccounts(function(error, accounts){
      var adoptionInstance;
      var account = accounts[0];
      App.lastRenderedForAccount = account;

      App.contracts.Adoption.deployed().then(function(instance){
        adoptionInstance = instance;
        return adoptionInstance.getAdopters.call();
      }).then(function(adopters){
        for(i = 0; i < adopters.length; i++){
          if(adopters[i] !== '0x0000000000000000000000000000000000000000'){      
            var curPetPanel = $('.panel-pet').eq(i);                          
            curPetPanel.addClass('panel-success');
            curPetPanel.find('.pet-adopter').text(adopters[i].substring(0, 10) + "...");
            curPetPanel.find('.pet-adopter-wrapper').removeClass('invisible');
            
            var adoptButton = curPetPanel.find('.btn-adopt');
            adoptButton.attr('disabled', true);
            if(account == adopters[i]){
              adoptButton.text('Yours!');
              curPetPanel.find('.btn-force-adopt').addClass('invisible');
            } else {
              adoptButton.text('Adopted!');
              curPetPanel.find('.btn-force-adopt').removeClass('invisible');
            }                                  
          }
        }      
      }).catch(function(err){
        console.log(err.message);
      });
    })    
  },

  handleAdopt: function(event) {
    event.preventDefault();

    console.log(event);

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts){
      
      if(error){
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance){
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        if($(event.target).text() == "Steal"){
          console.log(petId);
          console.log(account);
          return adoptionInstance.forceAdopt(petId, {from: account});
        }

        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result){
        return App.markAdopted();
      }).catch(function(err){
        console.log(err.message);
      });
      
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
