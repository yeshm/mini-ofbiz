package org.miniofbiz.example.person

import org.ofbiz.base.util.UtilDateTime
import org.ofbiz.entity.Delegator
import org.ofbiz.entity.GenericValue
import org.ofbiz.entity.util.EntityUtil
import org.ofbiz.service.LocalDispatcher
import org.ofbiz.service.ServiceUtil

public Map createPerson() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def nowTimestamp = UtilDateTime.nowTimestamp()

    GenericValue person = delegator.makeValue("Person")
    person.setNonPKFields(parameters)
    person.createdDate = nowTimestamp
    person.createdByUserLogin = userLogin.userLoginId
    person.lastModifiedDate = nowTimestamp
    person.lastModifiedByUserLogin = userLogin.userLoginId
    person.setNextSeqId()
    person.create()

    def results = ServiceUtil.returnSuccess()
    results.personId = person.personId

    return results
}

public Map updatePerson() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def personId = parameters.personId
    def nowTimestamp = UtilDateTime.nowTimestamp()
    def results = ServiceUtil.returnSuccess()

    def person = delegator.findOne("Person", [personId: personId], false)
    results.personId = person.personId
    results.oldStatusId = person.statusId

    person.setNonPKFields(parameters)
    person.lastModifiedDate = nowTimestamp
    person.lastModifiedByUserLogin = userLogin.userLoginId
    person.store()

    return results
}

public Map deletePerson() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def personId = parameters.personId
    def results = ServiceUtil.returnSuccess()

    delegator.removeByAnd("PersonStatus", [personId: personId])

    def person = delegator.findOne("Person", [personId: personId], false)
    person.remove()

    results.personId = personId
    return results
}

public Map createPersonStatus() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def personId = parameters.personId
    def nowTimestamp = UtilDateTime.nowTimestamp()

    //find the most recent status record and set the statusEndDate
    def oldPersonStatusList = delegator.findByAnd("PersonStatus", [personId: personId], ["-statusDate"], false)
    def oldPersonStatus = EntityUtil.getFirst(oldPersonStatusList)
    if (oldPersonStatus) {
        oldPersonStatus.statusEndDate = nowTimestamp
        oldPersonStatus.store()
    }

    def personStatus = delegator.makeValue("PersonStatus")
    personStatus.personId = personId
    personStatus.statusDate = nowTimestamp
    personStatus.setNonPKFields(parameters)
    personStatus.create()

    return ServiceUtil.returnSuccess()
}