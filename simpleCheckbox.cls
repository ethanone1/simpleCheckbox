public with sharing class simpleCheckbox {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [SELECT Id, Name FROM Account WHERE LAO_Office__c = 'Scottsdale'];
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountOptions() {
        return [SELECT Id, Name FROM Account WHERE LAO_Office__c = 'Scottsdale'];
    }

    @AuraEnabled(cacheable=true)
    public static List<lda_Commission__c> getCommissions(Id rid){
        return [SELECT Id, Agent__c FROM lda_Commission__c WHERE DealId__c = :rid];
    }
}