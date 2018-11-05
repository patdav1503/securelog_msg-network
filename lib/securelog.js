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
 * Write your transction processor functions here
 */
/**
 * Send public message transaction
 * @param {org.securelog.mynetwork.postErrorMessage} newMessage
 * @transaction
 */
async function postErrorMessage(newMessage) {
    var creator;
    // Validate input references
    if (newMessage.creator) {
        var lastName = newMessage.creator.lastName;
        creator = newMessage.creator;
    } else {
        creator = getCurrentParticipant();
    }
    var ownerlastname = newMessage.owner.lastName;
    console.log('publicMessage-->creator ' + newMessage.creator);
    console.log('publicMessage-->getCurrentParticipant ' + getCurrentParticipant());

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';

    var myMessage = factory.newResource(NS, 'ErrorMessage', newMessage.messageId);
    myMessage.creator = creator;
    myMessage.owner = newMessage.owner;
    myMessage.errorType = newMessage.errorType;
    if (newMessage.errorSeverity) {
        myMessage.errorSeverity = newMessage.errorSeverity;
    } else {
        myMessage.errorSeverity = 'INFO';
    }
    if (newMessage.errorStatus) {
        myMessage.errorStatus = newMessage.errorStatus;
    } else {
        myMessage.errorStatus = 'NEW';
    }
    myMessage.errorText = newMessage.errorText;

    await getAssetRegistry(NS + '.ErrorMessage')
        .then(function(messageRegistry) {
            // Add the message
            return messageRegistry.addAll([myMessage]);
        });

    // Send private message to message owner
    var ownerConcept = factory.newConcept(NS, 'conceptPrivateMessage');
    ownerConcept.creator = creator;
    ownerConcept.recipient = myMessage.owner;
    ownerConcept.messageId = newMessage.messageId;
    ownerConcept.subject = '';
    ownerConcept.value = '';
    await sendPrivateMessage(ownerConcept);

    // emit the event for message creation
    var event = factory.newEvent(NS,'ErrorMessageCreated');
    event.newMessage = myMessage.getFullyQualifiedIdentifier();
    event.creator = myMessage.creator;
    event.owner = myMessage.owner;
    event.errorType = myMessage.errorType;
    event.errorSeverity = myMessage.errorSeverity;
    emit(event);

}

/**
 * Change error message owner transaction
 * @param {org.securelog.mynetwork.updateErrorMessageOwner} newTrans
 * @transaction
 */
async function updateErrorMessageOwner(newTrans) {
    // Validate input references
    var oldOwner = newTrans.oldMessage.owner;
    var lastName = newTrans.newOwner.lastName;

    newTrans.oldMessage.owner = newTrans.newOwner;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(newTrans.oldMessage.getFullyQualifiedType());
    // Update the asset in the asset registry.
    await assetRegistry.update(newTrans.oldMessage);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';
    var event = factory.newEvent(NS,'ErrorMessageOwnerUpdated');
    event.oldMessage = newTrans.oldMessage.getFullyQualifiedIdentifier();
    event.oldOwner = oldOwner;
    event.newOwner = newTrans.oldMessage.owner;
    emit(event);
}

/**
 * Update message subject transaction
 * @param {org.securelog.mynetwork.updateErrorMessageStatus} newTrans
 * @transaction
 */
async function updateErrorMessageStatus(newTrans) {
    // Validate input references
    var oldStatus = newTrans.oldMessage.errorStatus;

    newTrans.oldMessage.errorStatus = newTrans.newStatus;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(newTrans.oldMessage.getFullyQualifiedType());
    // Update the asset in the asset registry.
    await assetRegistry.update(newTrans.oldMessage);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';
    var event = factory.newEvent(NS,'ErrorMessageStatusUpdated');
    event.oldMessage = newTrans.oldMessage.getFullyQualifiedIdentifier();
    event.oldStatus = oldStatus;
    event.newStatus = newTrans.oldMessage.errorStatus;
    emit(event);
}

/**
 * Update message subject transaction
 * @param {org.securelog.mynetwork.updateErrorMessageSeverity} newTrans
 * @transaction
 */
async function updateErrorMessageSeverity(newTrans) {
    // Validate input references
    var oldSeverity = newTrans.oldMessage.errorSeverity;

    newTrans.oldMessage.errorSeverity = newTrans.newSeverity;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(newTrans.oldMessage.getFullyQualifiedType());
    // Update the asset in the asset registry.
    await assetRegistry.update(newTrans.oldMessage);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';
    var event = factory.newEvent(NS,'ErrorMessageSeverityUpdated');
    event.oldMessage = newTrans.oldMessage.getFullyQualifiedIdentifier();
    event.oldSeverity = oldSeverity;
    event.newSeverity = newTrans.oldMessage.errorSeverity;
    emit(event);
}

/**
 * Send public message transaction
 * @param {org.securelog.mynetwork.sendPublicMessage} newMessage
 * @transaction
 */
async function sendPublicMessage(newMessage) {
    var creator;
    // Validate input references
    if (newMessage.creator) {
        var lastName = newMessage.creator.lastName;
        creator = newMessage.creator;
    } else {
        creator = getCurrentParticipant();
    }
    console.log('publicMessage-->creator ' + newMessage.creator);
    console.log('publicMessage-->getCurrentParticipant ' + getCurrentParticipant());

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';

    var myMessage = factory.newResource(NS, 'Message', newMessage.messageId);
    myMessage.creator = creator;
    myMessage.value = newMessage.value;
    myMessage.subject = newMessage.subject;

    await getAssetRegistry(NS + '.Message')
        .then(function(messageRegistry) {
            // Add the message
            return messageRegistry.addAll([myMessage]);
        });

    // emit the event for message creation
    var event = factory.newEvent(NS,'MessageCreated');
    event.newMessage = myMessage.getFullyQualifiedIdentifier();
    event.creator = myMessage.creator;
    event.subject = myMessage.subject;
    emit(event);
    console.log('publicMessage-->event '+event);

}

/**
 * Send public reply transaction
 * @param {org.securelog.mynetwork.sendPublicReply} newReply
 * @transaction
 */
async function sendPublicReply(newReply) {
    var creator;
    // Validate input references
    var messageCreator = newReply.parentMessage.creator;
    if (newReply.creator) {
        var lastName = newReply.creator.lastName;
        creator = newReply.creator;
    } else {
        creator = getCurrentParticipant();
    }
    console.log('publicReply-->parentMessage '+newReply.parentMessage);
    console.log('publicReply-->owner ' + newReply.creator);
    console.log('publicReply-->messageOwner ' + messageCreator);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';

    var myReply = factory.newResource(NS, 'Reply', newReply.replyId);
    myReply.replyTo = newReply.parentMessage;
    myReply.creator = creator;
    myReply.value = newReply.value;
    myReply.subject = newReply.subject;

    await getAssetRegistry(NS + '.Reply')
        .then(function(replyRegistry) {
            // Add the reply
            return replyRegistry.addAll([myReply]);
        });

    // emit the event for reply created
    var event = factory.newEvent(NS,'ReplyCreated');
    event.newReply = myReply.getFullyQualifiedIdentifier();
    event.replyTo = myReply.replyTo.getFullyQualifiedIdentifier();
    event.creator = myReply.creator;
    event.subject = myReply.subject;
    emit(event);

}

/**
 * Send private message transaction
 * @param {org.securelog.mynetwork.sendPrivateMessage} newMessage
 * @transaction
 */
async function sendPrivateMessage(newMessage) {
    var creator;
    // Validate input references
    if (newMessage.creator) {
        var lastName = newMessage.creator.lastName;
        creator = newMessage.creator;
    } else {
        creator = getCurrentParticipant();
    }
    var lastNameR = newMessage.recipient.lastName;
    console.log('privateMessage-->owner ' + newMessage.creator);
    console.log('privateMessage-->recipient ' + newMessage.recipient);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';

    var myMessage = factory.newResource(NS, 'directMessage', newMessage.messageId);
    myMessage.creator = creator;
    myMessage.recipient = newMessage.recipient;
    myMessage.value = newMessage.value;
    myMessage.subject = newMessage.subject;

    await getAssetRegistry(NS + '.directMessage')
        .then(function(messageRegistry) {
            // Add the reply
            return messageRegistry.addAll([myMessage]);
        });

    // emit the event for message created
    var event = factory.newEvent(NS,'MessageCreated');
    event.newMessage = myMessage.getFullyQualifiedIdentifier();
    event.creator = myMessage.creator;
    event.recipient = myMessage.recipient;
    event.subject = myMessage.subject;
    emit(event);
    console.log('publicMessage-->event '+event);

}

/**
 * Send public reply transaction
 * @param {org.securelog.mynetwork.sendPrivateReply} newReply
 * @transaction
 */
async function sendPrivateReply(newReply) {
    var creator;
    // Validate input references
    if (newReply.creator) {
        var lastName = newReply.creator.lastName;
        creator = newReply.creator;
    } else {
        creator = getCurrentParticipant();
    }
    var messageCreator = newReply.parentMessage.creator;
    var lastNameR = newReply.recipient.lastName;
    console.log('privateReply-->parentMessage '+newReply.parentMessage);
    console.log('privateReply-->creator ' + newReply.creator);
    console.log('privateReply-->recipient ' + newReply.recipient);
    console.log('privateReply-->messageOwner ' + messageCreator);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';

    var myReply = factory.newResource(NS, 'directReply', newReply.replyId);
    myReply.replyTo = newReply.parentMessage;
    myReply.creator = creator;
    myReply.recipient = newReply.recipient;
    myReply.value = newReply.value;
    myReply.subject = newReply.subject;

    await getAssetRegistry(NS + '.directReply')
        .then(function(replyRegistry) {
            // Add the reply
            return replyRegistry.addAll([myReply]);
        });

    // emit the event for reply created
    var event = factory.newEvent(NS,'ReplyCreated');
    event.newReply = myReply.getFullyQualifiedIdentifier();
    event.replyTo = myReply.replyTo.getFullyQualifiedIdentifier();
    event.creator = myReply.creator;
    event.recipient = myReply.recipient;
    event.subject = myReply.subject;
    emit(event);

}

/**
 * Update message subject transaction
 * @param {org.securelog.mynetwork.updateSubject} newTrans
 * @transaction
 */
async function updateSubject(newTrans) {
    // Validate input references
    var oldSubject = newTrans.oldMessage.subject;

    newTrans.oldMessage.subject = newTrans.newSubject;

    console.log('oldMessage.$class '+newTrans.oldMessage.getFullyQualifiedType());
    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(newTrans.oldMessage.getFullyQualifiedType());
    // Update the asset in the asset registry.
    await assetRegistry.update(newTrans.oldMessage);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';
    var event = factory.newEvent(NS,'SubjectUpdated');
    event.oldMessage = newTrans.oldMessage.getFullyQualifiedIdentifier();
    event.oldSubject = oldSubject;
    event.newSubject = newTrans.oldMessage.subject;
    emit(event);
}

/**
 * Update message value transaction
 * @param {org.securelog.mynetwork.updateValue} newTrans
 * @transaction
 */
async function updateValue(newTrans) {
    // Validate input references
    var oldValue = newTrans.oldMessage.value;

    newTrans.oldMessage.value = newTrans.newValue;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(newTrans.oldMessage.getFullyQualifiedType());
    // Update the asset in the asset registry.
    await assetRegistry.update(newTrans.oldMessage);

    // This is the factory for creating instances of types.
    var factory = getFactory();
    var NS = 'org.securelog.mynetwork';
    var event = factory.newEvent(NS,'ValueUpdated');
    event.oldMessage = newTrans.oldMessage.getFullyQualifiedIdentifier();
    event.oldValue = oldValue;
    event.newValue = newTrans.oldMessage.value;
    emit(event);
}

