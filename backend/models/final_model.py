from transformers import AutoTokenizer, TextIteratorStreamer
from auto_gptq import AutoGPTQForCausalLM
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_community.vectorstores import FAISS
from FlagEmbedding import FlagModel
import requests, re, urllib.parse, torch
from threading import Thread


class PredictionPipeline:
    def __init__(self):
        self.model_id = "TheBloke/TinyLlama-1.1B-Chat-v1.0-GPTQ"  
        self.temperature = 0.3
        self.bit = ["gptq-4bit-32g-actorder_True", "gptq-8bit-128g-actorder_True"]
        self.sentence_transformer_modelname = 'sentence-transformers/all-MiniLM-L6-v2' # 'sentence-transformers/all-MiniLM-L6-v2'
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"1. Device being utilized: {self.device} !!!")


    def load_model_and_tokenizers(self):
        '''
        This method initializes the tokenizer and GPTQ model using AutoGPTQForCausalLM.
        '''
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            use_fast=True,
            model_max_length=2048        )

        self.model = AutoGPTQForCausalLM.from_quantized(
            self.model_id,
            revision=self.bit[1],  
            use_safetensors=True,
            trust_remote_code=False,
            device="cuda:0",         
            inject_fused_attention=False
        )

        self.streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
        print(f'2. {self.model_id} has been successfully loaded on GPU!!!')

    def load_sentence_transformer(self):
        '''
        This method will initialize our sentence transformer model to generate embeddings for a given query.
        '''
        self.sentence_transformer = HuggingFaceEmbeddings(
                                model_name=self.sentence_transformer_modelname,
                                model_kwargs={'device':'cpu'},
                            )
        print("3. Sentence Transformer Loaded !!!!!!")


    def load_reranking_model(self):
        '''
        An opensoure reranking model called bge-reranker from huggingface is utilized to perform reranking on the retrived relevant documents from vector store.
        This method will initialize the reranking model.        
        '''
        self.reranker = FlagModel('BAAI/bge-reranker-large', use_fp16=True)  # 'BAAI/bge-reranker-large'->2GB BAAI/bge-reranker-base-> 1GB
        print("4. Re-Ranking Algorithm Loaded !!!")
       
    def load_embeddings(self):
        '''
        This method will load the FAISS vector database that was developed in the Data_prerpation_NEPSE.
        '''
        self.vector_db = FAISS.load_local(
            "../data/vector data/data_vector_db",
            self.sentence_transformer,
            allow_dangerous_deserialization=True  
        )
        print(f"5. FAISS VECTOR STORE LOADED !!!")


    def rerank_contexts(self, query, contexts, number_of_reranked_documents_to_select = 3):
        '''
        Perform reranking on the retrieved documents.

        Parameters:
        query -> the question aksed by the user
        contexts -> the relevant documents retrived from the vector store
        number_of_reranked_documents_to_select -> Top k documents to choose from after reranking them.

        return:
        top k contexts after reranking. [List]
        '''
        
        # Encode the query and contexts using the reranker's embedding model
        embeddings_1 = self.reranker.encode(query)
        embeddings_2 = self.reranker.encode(contexts)
        
        # Calculate the similarity between the query and each context
        similarity = embeddings_1 @ embeddings_2.T

        # Ensure the number of reranked documents to select is not greater than the total number of contexts.
        # If the number of documents to rerank is more than the number of retrieved documents, return all documents
        number_of_contexts = len(contexts)
        if number_of_reranked_documents_to_select > number_of_contexts:
            print(f"WARNING !!! Length of contexts({number_of_contexts}) is less than number_of_reranked_documents_to_select ({number_of_reranked_documents_to_select})")
            number_of_reranked_documents_to_select = number_of_contexts

        # Select the indices of the highest-ranked contexts based on similarity
        highest_ranked_indices = sorted(range(len(similarity)), key=lambda i: similarity[i], reverse=True)[:number_of_reranked_documents_to_select]

        # Return the reranked contexts based on the selected indices
        return [contexts[index] for index in highest_ranked_indices]
    

    def is_text_nepali(self, text):
        '''
        This method checks if a question asked by the user contains any nepali word. If so, the response from the LLM is also returned in Nepali -
        - using google translate API

        parameters:
        text -> the question asked by the user

        returns: bool
        True if the text contains any nepali word else false
        '''
        nepali_regex = re.compile(r'[\u0900-\u097F]+')
        if nepali_regex.search(text):
            return True
        return False
    

    def translate_using_google_api(self, text, source_language = "auto", target_language = "ne", timeout=5):
        '''
        This function has been copied from here:
        # https://github.com/ahmeterenodaci/easygoogletranslate/blob/main/easygoogletranslate.py

        This free API is used to perform translation between English to Nepali and vice versa.

        parameters: 
        source_language -> the language code for the source language
        target_language -> the new language to which the text is to be translate 

        returns
        '''
        pattern = r'(?s)class="(?:t0|result-container)">(.*?)<'
        escaped_text = urllib.parse.quote(text.encode('utf8'))
        url = 'https://translate.google.com/m?tl=%s&sl=%s&q=%s'%(target_language, source_language, escaped_text)
        response = requests.get(url, timeout=timeout)
        result = response.text.encode('utf8').decode('utf8')
        result = re.findall(pattern, result)  
        return result
    
    def split_and_translate_text(self, text, source_language = "auto", target_language = "ne", max_length=5000):
        """
        Split the input text into sections with a maximum length.
        
        Parameters:
        - text: The input text to be split.
        - max_length: The maximum length for each section (default is 5000 characters).

        Returns:c
        A list of strings, each representing a section of the input text.
        """

        if source_language == "en":
            splitted_text = text.split(".")
        elif source_language == "ne":
            splitted_text = text.split("।")
        else:
            splitted_text = [text[i:i+max_length] for i in range(0, len(text), max_length)]

        # perform translation (the free google api can only perform translation for 5000 characters max. So, splitting the text is necessary )
        translate_and_join_splitted_text = " ".join([self.translate_using_google_api(i, source_language, target_language)[0] for i in splitted_text])
        return translate_and_join_splitted_text
    
    def perform_translation(self, question, source_language, target_language):
        try:
            # Check if the length of the question is greater than 5000 characters
            if len(question) > 5000:
                # If so, split and translate the text using a custom method
                return self.split_and_translate_text(question, source_language, target_language)
            else:
                # If not, use the Google Translation API to translate the entire text
                return self.translate_using_google_api(question, source_language, target_language)[0]
        except Exception as e:
            return [f"An error occurred, [{e}], while working with Google Translation API"]

        
    def make_predictions(self, question, top_n_values=5):
            '''
            This method will perform the prediction 
            Parameters:
            question -> The question asked by the user
            top_n_values -> The top n values to select from the relavant retrived documents from vector store.
            '''

            # this method checks if the question asked by the user is nepali or not
            is_original_language_nepali = self.is_text_nepali(question)         

            # if the text is nepali, translate it to english first to get relevant docs from vector store, else just     
            question = self.perform_translation(question, 'ne', 'en')   
            print("Translated Question: ", question)
            if  isinstance(question, list):
                yield "data: " + str(question[0])+"\n\n"
                yield "data: END\n\n"
                
            # get relevant docs from vector store with similarity score (l2 distance /euclidean distance)
            similarity_search = self.vector_db.similarity_search_with_score(question, k=top_n_values)
            
            # only select the relevant docs with euclidean distance less than 1.5
            context = [doc.page_content for doc, score in similarity_search if score < 1.2]
            number_of_contexts = len(context)

            if number_of_contexts == 0:
                yield "data: Please know that the question asked and domain knowledge provided are irrelavant. Therefore, unable to provide answer to this question. Thank you.\n\n"

            else:
                if number_of_contexts > 1:
                    # perform reranking
                    context = self.rerank_contexts(question, context)

                context = ". ".join(context)
                

                # the prompt being used to be passed into the LLM
                prompt = f"""
                <|system|>
                Answer based ONLY on this context (keep response under 3 sentences):
                {context}

                If the answer isn't in the context, say "I don't know."</s>
                <|user|>
                {question}</s>
                <|assistant|>
                """
                # performing tokenization and passing input to GPU
                inputs = self.tokenizer([prompt], return_tensors="pt").to("cuda")
                generation_kwargs = dict(
                    inputs,
                    streamer=self.streamer,
                    max_new_tokens=500,  
                    do_sample=True,
                    temperature=0.3,
                    top_p=0.9,          
                    top_k=40,
                    repetition_penalty=1.2,  
                    pad_token_id=self.tokenizer.eos_token_id  
                )
                
                '''
                Since LLMs are auto-regressive models, they are able to predict the next word in sequence. This means, as the model keeps on predicting the next word-
                - we can access the word and pass to the front-end. This efficitively improves user experience as the user won't have to wait until an entire response has
                been generated. This is also called text/response streaming.
                
                Here, I use threading to get the tokens being generated in real-time and utilize SSE (Server side events) to stream the responses to frontend in real time.

                '''
                thread = Thread(target=self.model.generate, kwargs=generation_kwargs)

                thread.start()
                if is_original_language_nepali:
                    buffer = ""
                    for token in self.streamer:
                        if token != "</s>":
                            buffer += token
                            # Translate at every punctuation (not just ".")
                            if any(punct in token for punct in [".", "?", "!", "।"]):
                                translated = self.translate_using_google_api(buffer, "en", "ne")[0]
                                yield f"data: {translated}\n\n"
                                buffer = ""
                else:
                    for token in self.streamer:
                        yield f"data: {token}\n\n"  # Format for SSE
                thread.join()
            yield "data: END\n\n"
            
# Initialize a PredictionPipeline object
pipeline = PredictionPipeline()
pipeline.load_model_and_tokenizers()
pipeline.load_sentence_transformer()
pipeline.load_reranking_model()
pipeline.load_embeddings()


# Example test queries (feel free to change or add more)
test_queries = [
    "What is the minimum capital requirement for opening a broker company in Nepal?",
    "IPO को बारेमा जानकारी दिनुहोस्।",  # Nepali query
    "Which stock had the highest trading volume last week?",
]

# Run predictions for each query and print the streamed result
for query in test_queries:
    print(f"\n=== QUERY: {query} ===")
    for response in pipeline.make_predictions(query):
        print(response.replace("data: ", "").strip())
