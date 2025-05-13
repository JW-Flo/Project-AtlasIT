from google.cloud import bigquery
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize BigQuery client
client = bigquery.Client()

def generate_report(query, output_file):
    try:
        logger.info("Running query...")
        query_job = client.query(query)
        results = query_job.result()

        logger.info(f"Writing results to {output_file}...")
        with open(output_file, "w") as f:
            for row in results:
                f.write(f"{row}\n")

        logger.info("Report generated successfully.")
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")

if __name__ == "__main__":
    QUERY = """
    SELECT * FROM `your_project_id.your_dataset.your_table`
    LIMIT 100
    """
    OUTPUT_FILE = "reports/report.txt"

    generate_report(QUERY, OUTPUT_FILE)
