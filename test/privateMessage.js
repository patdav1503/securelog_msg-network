/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const namespace = 'org.securelog.mynetwork';
const assetType = 'directMessage';
const assetNS = namespace + '.' + assetType;
const participantType = 'Member';
const participantNS = namespace + '.' + participantType;

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };

    // Name of the business network card containing the administrative identity for the business network
    const adminCardName = 'admin';

    // Admin connection to the blockchain, used to deploy the business network
    let adminConnection;

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    const aliceCardName = 'alice';
    const bobCardName = 'bob';
    const georgeCardName = 'george';

    // These are a list of receieved events.
    let events;

    let businessNetworkName;

    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
     */
    async function importCardForIdentity(cardName, identity) {
        const metadata = {
            userName: identity.userID,
            version: 1,
            enrollmentSecret: identity.userSecret,
            businessNetwork: businessNetworkName
        };
        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(cardName, card);
    }

    // This is called before each test is executed.
    beforeEach(async () => {
        // Generate a business network definition from the project directory.
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        businessNetworkName = businessNetworkDefinition.getName();
        await adminConnection.install(businessNetworkDefinition);
        const startOptions = {
            networkAdmins: [
                {
                    userName: 'admin',
                    enrollmentSecret: 'adminpw'
                }
            ]
        };
        const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
        await adminConnection.importCard(adminCardName, adminCards.get('admin'));

        // Create and establish a business network connection
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(adminCardName);

        // Get the factory for the business network.
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const participantRegistry = await businessNetworkConnection.getParticipantRegistry(participantNS);
        // Create the participants.
        const alice = factory.newResource(namespace, participantType, 'alice@email.com');
        alice.firstName = 'Alice';
        alice.lastName = 'A';

        const bob = factory.newResource(namespace, participantType, 'bob@email.com');
        bob.firstName = 'Bob';
        bob.lastName = 'B';

        const george = factory.newResource(namespace, participantType, 'george@email.com');
        george.firstName = 'George';
        george.lastName = 'G';

        participantRegistry.addAll([alice, bob, george]);

        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        // Create the assets.
        const asset1 = factory.newResource(namespace, assetType, '1');
        asset1.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        asset1.recipient = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset1.value = 'This is a test';
        asset1.subject = 'Hello There!';

        const asset2 = factory.newResource(namespace, assetType, '2');
        asset2.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset2.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        asset2.value = 'Another test message from bob';
        asset2.subject = 'Goodbye All!';

        assetRegistry.addAll([asset1, asset2]);

        // Issue the identities.
        let identity = await businessNetworkConnection.issueIdentity(participantNS + '#alice@email.com', 'alice1');
        await importCardForIdentity(aliceCardName, identity);
        identity = await businessNetworkConnection.issueIdentity(participantNS + '#bob@email.com', 'bob1');
        await importCardForIdentity(bobCardName, identity);
        identity = await businessNetworkConnection.issueIdentity(participantNS + '#george@email.com', 'george1');
        await importCardForIdentity(georgeCardName, identity);
    });

    /**
     * Reconnect using a different identity.
     * @param {String} cardName The name of the card for the identity to use
     */
    async function useIdentity(cardName) {
        await businessNetworkConnection.disconnect();
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', (event) => {
            events.push(event);
        });
        await businessNetworkConnection.connect(cardName);
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
    }

    it('Alice can read all of the assets', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const assets = await assetRegistry.getAll();

        // Validate the assets.  Alice can't read message 2
        assets.should.have.lengthOf(1);
        const asset1 = assets[0];
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.value.should.equal('This is a test');
    });

    it('Bob can read all of the assets', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const assets = await assetRegistry.getAll();

        // Validate the assets.
        assets.should.have.lengthOf(2);
        const asset1 = assets[0];
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.value.should.equal('This is a test');
        const asset2 = assets[1];
        asset2.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset2.value.should.equal('Another test message from bob');
    });

    it('Alice can add assets that she owns', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Create the asset.
        let asset3 = factory.newResource(namespace, assetType, '3');
        asset3.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        asset3.recipient = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset3.value = 'This is not a test';
        asset3.subject = 'Hello Everybody!';

        // Add the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.add(asset3);

        // Validate the asset.
        asset3 = await assetRegistry.get('3');
        asset3.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset3.value.should.equal('This is not a test');
    });

    it('Alice cannot add assets that Bob owns', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Create the asset.
        const asset3 = factory.newResource(namespace, assetType, '3');
        asset3.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset3.value = 'This is not a test';

        // Try to add the asset, should fail.
        const assetRegistry = await  businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.add(asset3).should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Bob can add assets that he owns', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Create the asset.
        let asset4 = factory.newResource(namespace, assetType, '4');
        asset4.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset4.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        asset4.value = 'bob creates another message';
        asset4.subject = 'Why oh Why?';

        // Add the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.add(asset4);

        // Validate the asset.
        asset4 = await assetRegistry.get('4');
        asset4.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset4.value.should.equal('bob creates another message');
    });

    it('Bob cannot add assets that Alice owns', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Create the asset.
        const asset4 = factory.newResource(namespace, assetType, '4');
        asset4.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        asset4.value = 'bob creates another message';
        asset4.subject = 'Why oh Why?';

        // Try to add the asset, should fail.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.add(asset4).should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Alice can update her assets', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Create the asset.
        let asset1 = factory.newResource(namespace, assetType, '1');
        asset1.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        asset1.recipient = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset1.value = 'This is another test';
        asset1.subject = 'Hello There!';

        // Update the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.update(asset1);

        // Validate the asset.
        asset1 = await assetRegistry.get('1');
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.value.should.equal('This is another test');
    });

    it('Alice cannot update Bob\'s assets', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Create the asset.
        const asset2 = factory.newResource(namespace, assetType, '2');
        asset2.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset2.value = '50';
        asset2.subject = 'Does not matter';

        // Try to update the asset, should fail.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.update(asset2).should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Bob can update his assets', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Create the asset.
        let asset2 = factory.newResource(namespace, assetType, '2');
        asset2.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        asset2.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        asset2.value = '60';
        asset2.subject = 'Not again!';

        // Update the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.update(asset2);

        // Validate the asset.
        asset2 = await assetRegistry.get('2');
        asset2.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset2.value.should.equal('60');
    });

    it('Bob cannot update Alice\'s assets', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Create the asset.
        const asset1 = factory.newResource(namespace, assetType, '1');
        asset1.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        asset1.value = '60';

        // Update the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.update(asset1).should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Alice can remove her assets', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.remove('1');
        const exists = await assetRegistry.exists('1');
        exists.should.be.false;
    });

    it('Alice cannot remove Bob\'s assets', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.remove('2').should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Bob can remove his assets', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.remove('2');
        const exists = await assetRegistry.exists('2');
        exists.should.be.false;
    });

    it('Bob cannot remove Alice\'s assets', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.remove('1').should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Alice can submit a message', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateMessage');
        myReply.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.messageId = '51';
        myReply.value = 'My first message';
        myReply.subject = 'First message';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directMessage');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first message');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Alice can submit a reply for her message', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directReply');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first reply');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.replyTo.should.equal(myReply.parentMessage.getFullyQualifiedIdentifier());
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Alice can submit a reply for her message without creator', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directReply');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first reply');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.replyTo.should.equal(myReply.parentMessage.getFullyQualifiedIdentifier());
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Alice cannot submit a reply for Bob\'s message', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the transaction.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','2');
        myReply.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        businessNetworkConnection.submitTransaction(myReply).should.be.rejectedWith(/collection with ID .* does not exist/);
    });

    it('Alice cannot submit a reply for her message with Bob as creator', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the transaction.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        businessNetworkConnection.submitTransaction(myReply).should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Bob can submit a message', async () => {
        // Use the identity for Alice.
        await useIdentity(bobCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateMessage');
        myReply.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.messageId = '51';
        myReply.value = 'My first message';
        myReply.subject = 'First message';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directMessage');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first message');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Bob can submit a reply for his message', async () => {
        // Use the identity for Alice.
        await useIdentity(bobCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.creator = factory.newRelationship(namespace, participantType, 'bob@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directReply');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first reply');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.replyTo.should.equal(myReply.parentMessage.getFullyQualifiedIdentifier());
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Bob can submit a reply for his message without creator', async () => {
        // Use the identity for Alice.
        await useIdentity(bobCardName);

        // Submit the reply.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        await businessNetworkConnection.submitTransaction(myReply);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directReply');
        const asset1 = await assetRegistry.get('51');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset1.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        asset1.value.should.equal('My first reply');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.replyTo.should.equal(myReply.parentMessage.getFullyQualifiedIdentifier());
        event.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        event.recipient.getFullyQualifiedIdentifier().should.equal(participantNS + '#george@email.com');
        event.subject.should.equal(myReply.subject);
    });

    it('Bob cannot submit a reply for her message with Alice as creator', async () => {
        // Use the identity for Alice.
        await useIdentity(bobCardName);

        // Submit the transaction.
        const myReply = factory.newTransaction(namespace, 'sendPrivateReply');
        myReply.parentMessage = factory.newRelationship(namespace,'directMessage','1');
        myReply.creator = factory.newRelationship(namespace, participantType, 'alice@email.com');
        myReply.recipient = factory.newRelationship(namespace, participantType, 'george@email.com');
        myReply.replyId = '51';
        myReply.value = 'My first reply';
        myReply.subject = 'Re: First reply';
        businessNetworkConnection.submitTransaction(myReply).should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Alice can update the subject of her message', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','1');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directMessage');
        const asset1 = await assetRegistry.get('1');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#alice@email.com');
        asset1.subject.should.equal('Hello Everybody!');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.oldMessage.should.equal(myTrans.oldMessage.getFullyQualifiedIdentifier());
        event.oldSubject.should.equal('Hello There!');
        event.newSubject.should.equal('Hello Everybody!');
    });

    it('Alice can not update the subject of Bob\'s message', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','2');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans).should.be.rejectedWith(/ID .* does not exist/);

    });

    it('Bob can update the subject of his message', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','2');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + 'directMessage');
        const asset1 = await assetRegistry.get('2');

        // Validate the asset.
        asset1.creator.getFullyQualifiedIdentifier().should.equal(participantNS + '#bob@email.com');
        asset1.subject.should.equal('Hello Everybody!');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.oldMessage.should.equal(myTrans.oldMessage.getFullyQualifiedIdentifier());
        event.oldSubject.should.equal('Goodbye All!');
        event.newSubject.should.equal('Hello Everybody!');
    });

    it('Bob can not update the subject of Alice\'s message', async () => {
        // Use the identity for Bob.
        await useIdentity(bobCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','1');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans).should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('George can not update the subject of Alice\'s message', async () => {
        // Use the identity for George.
        await useIdentity(georgeCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','1');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans).should.be.rejectedWith(/ID .* does not exist/);

    });

    it('George can not update the subject of Bob\'s message', async () => {
        // Use the identity for George.
        await useIdentity(georgeCardName);

        // Submit the reply.
        const myTrans = factory.newTransaction(namespace, 'updateSubject');
        myTrans.oldMessage = factory.newRelationship(namespace,'directMessage','2');
        myTrans.newSubject = 'Hello Everybody!';
        await businessNetworkConnection.submitTransaction(myTrans).should.be.rejectedWith(/does not have .* access to resource/);

    });

});
