import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { createRecord, deleteRecord } from "lightning/uiRecordApi";
import { reduceErrors } from "c/ldsUtils";

import getAccountList from "@salesforce/apex/simpleCheckbox.getAccountList";
import getAccountOptions from "@salesforce/apex/simpleCheckbox.getAccountOptions";
import getCommissions from "@salesforce/apex/simpleCheckbox.getCommissions";

import COMMISSION_OBJECT from "@salesforce/schema/lda_Commission__c";
import COMM_DID from "@salesforce/schema/lda_Commission__c.DealID__c";
import COMM_AGENTORDER from "@salesforce/schema/lda_Commission__c.Agent_Order__c";
import COMM_AGENTID from "@salesforce/schema/lda_Commission__c.Agent__c";

let url_string = window.location.href;
let url = new URL(url_string);
let rid = url.searchParams.get("Id");

export default class SimpleCheckbox extends LightningElement {
  @track selectedOptions = ["Option1"];
  @track accts = [];
  @track existingComms = [];
  @track error;
  @api recordId;
  @api rec2del;
  recordId = rid;

  @wire(getAccountList, {}) Accounts;
  @wire(getAccountOptions, {})
  myAccountFunc({ error, data }) {
    if (data) {
      this.accts = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.accts = undefined;
    }
  }

  @wire(getCommissions, { rid: "$recordId" })
  getCommissionsfunc({ error, data }) {
    if (data) {
      this.existingComms = data;
      this.selectOptions();
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.existingComms = undefined;
    }
  }

  selectOptions() {
    let alist = [];
    this.existingComms.forEach(function(element) {
      alist.push(element["Agent__c"]);
    });
    this.selectedOptions = alist;
  }

  get comms() {
    let alist = [];
    this.accts.forEach(function(element) {
      let objvar = { label: element["Name"], value: element["Id"] };
      alist.push(objvar);
    });
    return alist;
  }

  handleChange(e) {
    const beforeChangeList = this.selectedOptions;
    const afterChangelist = e.detail.value;
    const aRecId = this.recordId;
    this.selectedOptions = e.detail.value;

    console.log("before >>>> " + beforeChangeList);
    console.log("after >>>> " + afterChangelist);

    // Compare list for adds
    afterChangelist.forEach(function(element) {
      if (beforeChangeList.includes(element)) {
        console.log(">>>>, do nothing for " + element);
      } else {
        console.log(">>>>, add " + aRecId + " - " + element);
        const fields = { DealID__c: aRecId, Agent_Order__c: 1, Agent__c: element };
        const recordInput = { apiName: COMMISSION_OBJECT.objectApiName, fields };
        console.log(">>>> add " + JSON.stringify(recordInput));
        createRecord(recordInput)
          .then(lda_commission__c => {
            dispatchEvent(
              new ShowToastEvent({
                title: "Success",
                message: "Commission added",
                variant: "success"
              })
            );
            console.log(">>>> record created");
          })
          .catch(error => {
            dispatchEvent(
              new ShowToastEvent({
                title: "Error creating record",
                message: reduceErrors(error).join(", "),
                variant: "error"
              })
            );
            console.log(">>>> record not created." + reduceErrors(error).join(", "));
          });
      }
    });

    // Compare list for deletes
    beforeChangeList.forEach(function(element) {
      if (afterChangelist.includes(element)) {
        console.log(">>>>, do nothing for " + element);
      } else {
        console.log(">>>>, drop " + element);
        // element is an account id, need to get a commission id to delete a commission.
        // list of commissions needs to be updated when commission is added too
        // { accountId: commissionId } use this list to prevent duplicate creates too?
        const rec2del = element;
        deleteRecord(rec2del)
          .then(() => {
            dispatchEvent(
              new ShowToastEvent({
                title: "Success",
                message: "Commission is deleted",
                variant: "success"
              })
            );
            console.log(">>>> comm deleted");
          })
          .catch(error => {
            console.log(">>>> com not deleted. " + reduceErrors(error).join(", "));
            dispatchEvent(
              new ShowToastEvent({
                title: "Error while deleting commission",
                message: reduceErrors(error).join(", "),
                variant: "error"
              })
            );
          });
      }
    });
  }
}