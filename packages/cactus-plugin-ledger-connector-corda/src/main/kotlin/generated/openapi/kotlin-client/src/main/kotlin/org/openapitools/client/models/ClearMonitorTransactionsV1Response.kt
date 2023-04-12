/**
 * Hyperledger Cactus Plugin - Connector Corda
 *
 * Can perform basic tasks on a Corda ledger
 *
 * The version of the OpenAPI document: 0.3.0
 * 
 *
 * Please note:
 * This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit this file manually.
 */

@file:Suppress(
    "ArrayInDataClass",
    "EnumEntryName",
    "RemoveRedundantQualifierName",
    "UnusedImport"
)

package org.openapitools.client.models


import com.squareup.moshi.Json

/**
 * 
 *
 * @param success Flag set to true if operation completed correctly.
 * @param msg Message describing operation status or any errors that occurred.
 */

data class ClearMonitorTransactionsV1Response (

    /* Flag set to true if operation completed correctly. */
    @Json(name = "success")
    val success: kotlin.Boolean,

    /* Message describing operation status or any errors that occurred. */
    @Json(name = "msg")
    val msg: kotlin.String

)

