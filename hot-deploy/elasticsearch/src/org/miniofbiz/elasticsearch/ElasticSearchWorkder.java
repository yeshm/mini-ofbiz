package org.miniofbiz.elasticsearch;

import org.elasticsearch.action.admin.indices.exists.indices.IndicesExistsResponse;
import org.elasticsearch.action.admin.indices.exists.types.TypesExistsResponse;
import org.elasticsearch.client.Client;
import org.elasticsearch.client.IndicesAdminClient;
import org.elasticsearch.client.transport.TransportClient;
import org.elasticsearch.common.transport.InetSocketTransportAddress;
import org.ofbiz.base.util.Debug;

public class ElasticSearchWorkder {

    private static final String module = ElasticSearchWorkder.class.getName();

    private static Client client = null;

    public static Client getClient() {
        if (client != null) return client;

        String hostname = "127.0.0.1";
        int port = 9300;

        Debug.logInfo("get Elasticsearch Client with hostname:" + hostname + ",port:" + port, module);

        client = new TransportClient().addTransportAddress(new InetSocketTransportAddress(hostname, port));

        return client;
    }

    public static void closeClient() {
        if (client != null) {
            client.close();
            client = null;
        }
    }

    public static boolean isIndexExists(String indexName) {
        IndicesAdminClient adminClient = getClient().admin().indices();
        IndicesExistsResponse indicesExistsResponse = adminClient.prepareExists(indexName).execute().actionGet();

        return indicesExistsResponse.isExists();
    }

    public static boolean isTypeExists(String indexName, String typeName) {
        if (isIndexExists(indexName)) {
            TypesExistsResponse typesExistsResponse = getClient().admin().indices().prepareTypesExists(indexName).setTypes(typeName).execute().actionGet();

            return typesExistsResponse.isExists();
        }

        return false;
    }
}
