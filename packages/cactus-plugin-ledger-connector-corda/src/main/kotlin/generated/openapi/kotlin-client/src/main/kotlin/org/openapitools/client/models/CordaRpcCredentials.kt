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
 * @param hostname 
 * @param port 
 * @param username 
 * @param password 
 */

data class CordaRpcCredentials (

    @Json(name = "hostname")
    val hostname: kotlin.String,

    @Json(name = "port")
    val port: kotlin.Int,

    @Json(name = "username")
    val username: kotlin.String,

    @Json(name = "password")
    val password: kotlin.String

)

