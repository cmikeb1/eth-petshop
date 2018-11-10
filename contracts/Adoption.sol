pragma solidity ^0.4.17;

contract Adoption {
    address[16] public adopters; // public causes getter function to be automatically created
    event PetAdopted(address adopter, uint petId);

    function adopt(uint petId) public returns (uint) {
        return _adopt(petId, false);
    }

    function forceAdopt(uint petId) public returns (uint) {
        return _adopt(petId, true);
    }

    function _adopt(uint petId, bool force) private returns (uint) {
        // Make sure the pet exists.
        require(petId >= 0 && petId <= 15, "The petId supplied is outside the required range of [0-15]");

         // Make sure the pet has not already bee adopted (effectively the same as the exception thrown above, but using the lower-level 'revert').
        if(!force && adopters[petId] != address(0)) {
            revert("This pet has been adopted, and since string contatenation is hard I can't say by who");
        }

        adopters[petId] = msg.sender;

        emit PetAdopted(msg.sender, petId);

        return petId;
    }

    function getAdopters() public view returns (address[16]) {
        return adopters;
    }
}