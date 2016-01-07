import Utils from '../../Utils';
import * as i from '../../Interfaces';
import * as _ from 'lodash';
import Job from "../../Job";
import {parser} from "../../CommandExpander";
import Autocompletion from "../../Autocompletion";
import PluginManager from "../../PluginManager";
var filter: any = require('fuzzaldrin').filter;

class Command implements i.AutocompletionProvider {
    suggestions: Suggestion[] = [];

    async getSuggestions(job: Job) {
        const prompt = job.getPrompt();

        if (prompt.expanded.length < 2) {
            return [];
        }

        try {
            parser.yy.parseError = (err: any, hash: any) => {
                const token = hash.token === 'EOF' ? "'" : `'${hash.token}`;

                var filtered = _._(hash.expected).filter((value: string) => _.startsWith(value, token))
                    .map((value: string) => /^'(.*)'$/.exec(value)[1])
                    .value();

                this.suggestions = _.map(filtered, (value: string) => {
                    return {
                        value: value,
                        score: 10,
                        synopsis: '',
                        description: '',
                        type: value.startsWith('-') ? 'option' : 'command'
                    };
                });
            };

            parser.parse(prompt.expanded.join(' '));
            return [];
        } catch (exception) {
            return filter(this.suggestions, prompt.lastArgument, { key: 'value', maxResults: Autocompletion.limit });
        }
    }
}

PluginManager.registerAutocompletionProvider(new Command());